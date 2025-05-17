import express from "express";
import pool from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import { processImage, deleteFile } from "../utils/fileUtils.js";
import { v4 as uuidv4 } from "uuid";
import Joi from "joi";
import canvasViewOptimizer from "../utils/canvasViewOptimizer.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// --- Helper function to check memory ownership ---
async function checkMemoryOwnership(memoryId, userId) {
  const memoryCheck = await pool.query(
    "SELECT id FROM memories WHERE id = $1 AND user_id = $2",
    [memoryId, userId]
  );
  return memoryCheck.rows.length > 0;
}

// --- Memories Routes ---

// GET all memories for a user
router.get("/", authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT m.id, m.title, m.description, m.thumbnail_url, m.created_at, m.updated_at, COUNT(DISTINCT mp.photo_id) AS photo_count, COUNT(DISTINCT mvc.id) AS view_config_count FROM memories m LEFT JOIN memory_photos mp ON m.id = mp.memory_id LEFT JOIN memory_view_configurations mvc ON m.id = mvc.memory_id WHERE m.user_id = $1 GROUP BY m.id ORDER BY m.created_at DESC",
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// POST create a new memory
const createMemorySchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().allow("").optional(),
});
router.post("/", authenticateToken, async (req, res, next) => {
  try {
    const { error, value } = createMemorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { title, description } = value;
    const result = await pool.query(
      "INSERT INTO memories (user_id, title, description) VALUES ($1, $2, $3) RETURNING *",
      [req.user.userId, title, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// GET a specific memory's details
router.get("/:memoryId", authenticateToken, async (req, res, next) => {
  const { memoryId } = req.params;
  try {
    const memoryResult = await pool.query(
      "SELECT * FROM memories WHERE id = $1 AND user_id = $2",
      [memoryId, req.user.userId]
    );
    if (memoryResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Memory not found or access denied." });
    }
    const memory = memoryResult.rows[0];

    const photosResult = await pool.query(
      "SELECT p.id, p.file_path, p.captured_at, p.width, p.height FROM photos p JOIN memory_photos mp ON p.id = mp.photo_id WHERE mp.memory_id = $1 ORDER BY mp.added_at ASC",
      [memoryId]
    );
    memory.photos = photosResult.rows;

    const viewsResult = await pool.query(
      "SELECT id, name, view_type, configuration_data, is_primary_view, updated_at FROM memory_view_configurations WHERE memory_id = $1 AND user_id = $2 ORDER BY name ASC",
      [memoryId, req.user.userId]
    );
    memory.view_configurations = viewsResult.rows;

    res.json(memory);
  } catch (error) {
    next(error);
  }
});

// PUT update a memory's core details and canvas data
const updateMemorySchema = Joi.object({
  title: Joi.string().min(1).max(255).optional(),
  description: Joi.string().allow("").optional(),
  thumbnail_data_url: Joi.string().uri().allow(null, "").optional(), // For receiving base64 data URL
  memory_data: Joi.object().optional(), // For Fabric.js JSON data
  client_updated_at: Joi.string().isoDate().required(), // Added to handle client-provided timestamp
});

router.put("/:memoryId", authenticateToken, async (req, res, next) => {
  const { memoryId } = req.params;
  const userId = req.user.userId; // Get userId from authenticated token

  try {
    const { error, value } = updateMemorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { client_updated_at, ...updatesToApply } = value;
    const { title, description, thumbnail_data_url, memory_data } =
      updatesToApply;

    // Check if there are any actual fields to update besides the timestamp
    const updateKeys = Object.keys(updatesToApply);
    if (updateKeys.length === 0) {
      return res.status(400).json({
        error:
          "No actual data fields provided for update. Only a timestamp was found.",
      });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Check memory ownership first
      if (!(await checkMemoryOwnership(memoryId, userId))) {
        await client.query("ROLLBACK");
        client.release();
        return res
          .status(404)
          .json({ error: "Memory not found or access denied." });
      }

      // Update core memory fields
      const coreUpdateFields = [];
      const coreUpdateValues = [];
      let coreParamIndex = 1;

      if (title !== undefined) {
        coreUpdateFields.push(`title = $${coreParamIndex++}`);
        coreUpdateValues.push(title);
      }
      if (description !== undefined) {
        coreUpdateFields.push(`description = $${coreParamIndex++}`);
        coreUpdateValues.push(description);
      }
      if (thumbnail_data_url !== undefined) {
        coreUpdateFields.push(`thumbnail_url = $${coreParamIndex++}`);
        coreUpdateValues.push(thumbnail_data_url);
      }

      // Always update the memory's own updated_at timestamp using client_updated_at
      coreUpdateFields.push(`updated_at = $${coreParamIndex++}`);
      coreUpdateValues.push(client_updated_at);

      if (coreUpdateFields.length > 0) {
        // Will always be true as updated_at is included
        coreUpdateValues.push(memoryId, userId); // For WHERE clause
        const updateMemoryQuery = `UPDATE memories SET ${coreUpdateFields.join(
          ", "
        )} WHERE id = $${coreParamIndex++} AND user_id = $${coreParamIndex++}`;
        await client.query(updateMemoryQuery, coreUpdateValues);
      }

      if (memory_data !== undefined) {
        const viewConfigName = "Default Canvas View";
        const viewConfigType = "canvas";

        const existingViewConfig = await client.query(
          "SELECT id FROM memory_view_configurations WHERE memory_id = $1 AND user_id = $2 AND view_type = $3 AND name = $4",
          [memoryId, userId, viewConfigType, viewConfigName]
        );

        if (existingViewConfig.rows.length > 0) {
          // Update existing canvas view configuration
          const configId = existingViewConfig.rows[0].id;
          await client.query(
            "UPDATE memory_view_configurations SET configuration_data = $1, updated_at = $2 WHERE id = $3 AND user_id = $4",
            [memory_data, client_updated_at, configId, userId] // Use client_updated_at
          );
        } else {
          // Create new canvas view configuration
          await client.query(
            "INSERT INTO memory_view_configurations (memory_id, user_id, name, view_type, configuration_data, is_primary_view, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $7)",
            [
              memoryId,
              userId,
              viewConfigName,
              viewConfigType,
              memory_data,
              true,
              client_updated_at,
            ] // Use client_updated_at for created_at and updated_at
          );
        }
      }

      await client.query("COMMIT");

      // Refetch the full memory details to include any updated view configurations
      const finalMemoryResult = await client.query(
        "SELECT * FROM memories WHERE id = $1 AND user_id = $2",
        [memoryId, userId]
      );
      const finalMemory = finalMemoryResult.rows[0];

      const viewsResult = await client.query(
        "SELECT id, name, view_type, configuration_data, is_primary_view, updated_at FROM memory_view_configurations WHERE memory_id = $1 AND user_id = $2 ORDER BY name ASC",
        [memoryId, userId]
      );
      finalMemory.view_configurations = viewsResult.rows;

      res.json(finalMemory);
    } catch (transactionError) {
      await client.query("ROLLBACK");
      next(transactionError); // Pass to error handler
    } finally {
      client.release();
    }
  } catch (error) {
    // Catch errors from Joi validation or if client.connect() fails
    next(error);
  }
});

// DELETE a memory
router.delete("/:memoryId", authenticateToken, async (req, res, next) => {
  const { memoryId } = req.params;
  try {
    const deleteResult = await pool.query(
      "DELETE FROM memories WHERE id = $1 AND user_id = $2 RETURNING id",
      [memoryId, req.user.userId]
    );
    if (deleteResult.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Memory not found or access denied." });
    }
    res.status(204).send(); // No content
  } catch (error) {
    next(error);
  }
});

// --- Photo Upload and Linking ---

// POST upload new photo(s) for the user (not directly linked to a memory yet)
const photoUploadSchema = Joi.object({
  metadata: Joi.object().optional(),
  captured_at: Joi.date().iso().optional(),
  location_lat: Joi.number().min(-90).max(90).optional(),
  location_lng: Joi.number().min(-180).max(180).optional(),
  captured_place: Joi.string().optional(),
});

router.post(
  "/photos",
  authenticateToken,
  upload.array("photos", 10),
  async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded." });
    }

    const { error: bodyError, value: bodyValue } = photoUploadSchema.validate(
      req.body
    );
    if (bodyError) {
      for (const file of req.files) {
        if (file && file.path)
          await deleteFile(file.path).catch((e) =>
            console.error("Cleanup error:", e)
          );
      }
      return res.status(400).json({
        error: `Invalid photo metadata: ${bodyError.details[0].message}`,
      });
    }

    const userId = req.user.userId;
    const photoProcessingPromises = req.files.map(async (file) => {
      try {
        const photoId = uuidv4();
        const firstPartOfUuid = photoId.split("-")[0];
        const targetDirForProcessedImage = path.join(
          __dirname,
          "../file_storage/photos",
          firstPartOfUuid
        );

        const processingResult = await processImage(file.path, {
          targetDir: targetDirForProcessedImage,
          baseName: photoId,
        });

        const privateStorageBaseDir = path.join(
          __dirname,
          "../file_storage/photos"
        );
        const relativePathForDb = path.relative(
          privateStorageBaseDir,
          processingResult.processedPath
        );

        const dbResult = await pool.query(
          "INSERT INTO photos (id, user_id, file_path, mime_type, size_bytes, width, height, captured_at, location_lat, location_lng, captured_place, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id, file_path, created_at",
          [
            photoId,
            userId,
            relativePathForDb,
            processingResult.metadata.format,
            processingResult.metadata.size,
            processingResult.metadata.width,
            processingResult.metadata.height,
            bodyValue.captured_at,
            bodyValue.location_lat,
            bodyValue.location_lng,
            bodyValue.captured_place,
            bodyValue.metadata || {},
          ]
        );
        return dbResult.rows[0];
      } catch (uploadError) {
        if (file && file.path)
          await deleteFile(file.path).catch((e) =>
            console.error("Cleanup error for failed photo:", e)
          );
        throw uploadError;
      }
    });

    try {
      const uploadedPhotos = await Promise.all(photoProcessingPromises);
      res.status(201).json(uploadedPhotos);
    } catch (error) {
      console.error("Error processing one or more photo uploads:", error);
      next(error);
    }
  }
);

// GET all photos for the authenticated user
router.get("/photos", authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT id, file_path, created_at, width, height, captured_at, captured_place FROM photos WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// DELETE a photo from user's library
router.delete("/photos/:photoId", authenticateToken, async (req, res, next) => {
  const { photoId } = req.params;
  const userId = req.user.userId;
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const photoResult = await client.query(
      "SELECT file_path FROM photos WHERE id = $1 AND user_id = $2",
      [photoId, userId]
    );

    if (photoResult.rows.length === 0) {
      await client.query("ROLLBACK");
      client.release();
      return res
        .status(404)
        .json({ error: "Photo not found or access denied." });
    }
    const relativeFilePathInDb = photoResult.rows[0].file_path;
    const basePrivatePhotoDir = path.join(__dirname, "../file_storage/photos");
    const absoluteFilePathToDelete = path.join(
      basePrivatePhotoDir,
      relativeFilePathInDb
    );

    await client.query("DELETE FROM memory_photos WHERE photo_id = $1", [
      photoId,
    ]);

    const deleteDbResult = await client.query(
      "DELETE FROM photos WHERE id = $1 AND user_id = $2 RETURNING id",
      [photoId, userId]
    );

    if (deleteDbResult.rowCount === 0) {
      await client.query("ROLLBACK");
      client.release();
      return res
        .status(404)
        .json({ error: "Photo not found during delete operation." });
    }

    try {
      await deleteFile(absoluteFilePathToDelete);
    } catch (fileError) {
      console.warn(
        `Failed to delete file ${absoluteFilePathToDelete} but DB entry removed:`,
        fileError.message
      );
    }

    await client.query("COMMIT");
    res.status(200).json({
      message: "Photo deleted successfully and unlinked from all memories.",
    });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    next(error);
  } finally {
    if (client) client.release();
  }
});

// --- Authenticated Photo Viewing ---

// GET /api/memories/photos/:photoId/view-authenticated - Serve a photo for an authenticated user
router.get(
  "/photos/:photoId/view-authenticated",
  authenticateToken,
  async (req, res, next) => {
    const { photoId } = req.params;
    const userId = req.user.userId;

    try {
      const photoResult = await pool.query(
        "SELECT file_path, mime_type FROM photos WHERE id = $1 AND user_id = $2",
        [photoId, userId]
      );

      if (photoResult.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Photo not found or access denied." });
      }

      const { file_path: relativeFilePath, mime_type } = photoResult.rows[0];
      const basePrivatePhotoDir = path.join(
        __dirname,
        "../file_storage/photos"
      );
      const absolutePhotoPath = path.join(
        basePrivatePhotoDir,
        relativeFilePath
      );

      res.setHeader("Content-Type", mime_type || "image/jpeg");
      res.sendFile(absolutePhotoPath, (err) => {
        if (err) {
          if (err.code === "ENOENT") {
            console.error(
              `File not found for photoId ${photoId} at path ${absolutePhotoPath}`
            );
            if (!res.headersSent) {
              return res.status(404).json({ error: "Photo file not found." });
            }
            return;
          }
          console.error(`Error sending file for photoId ${photoId}:`, err);
          if (!res.headersSent) {
            return res.status(500).json({ error: "Error serving photo." });
          } else {
            console.error(
              "Headers already sent, cannot send JSON error response for authenticated photo view."
            );
          }
        }
      });
    } catch (error) {
      if (!res.headersSent) {
        next(error);
      } else {
        console.error(
          "Caught error after headers sent in authenticated photo view endpoint:",
          error
        );
        if (!res.writableEnded) {
          res.end();
        }
      }
    }
  }
);

// --- Memory Photos Linking ---

// POST link existing photo(s) to a memory
const linkPhotosSchema = Joi.object({
  photo_ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
});
router.post("/:memoryId/photos", authenticateToken, async (req, res, next) => {
  const { memoryId } = req.params;
  const userId = req.user.userId;

  try {
    const { error, value } = linkPhotosSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const { photo_ids } = value;

    const memoryCheck = await pool.query(
      "SELECT id FROM memories WHERE id = $1 AND user_id = $2",
      [memoryId, userId]
    );
    if (memoryCheck.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Memory not found or access denied." });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const links = [];
      for (const photoId of photo_ids) {
        const photoCheck = await client.query(
          "SELECT id FROM photos WHERE id = $1 AND user_id = $2",
          [photoId, userId]
        );
        if (photoCheck.rows.length === 0) {
          throw new Error(
            `Photo with ID ${photoId} not found or access denied.`
          );
        }
        const result = await client.query(
          "INSERT INTO memory_photos (memory_id, photo_id) VALUES ($1, $2) ON CONFLICT (memory_id, photo_id) DO NOTHING RETURNING *",
          [memoryId, photoId]
        );
        if (result.rows.length > 0) {
          links.push(result.rows[0]);
        }
      }
      await client.query("COMMIT");
      res.status(201).json({ message: "Photos linked successfully.", links });
    } catch (linkError) {
      await client.query("ROLLBACK");
      if (linkError.message.includes("not found or access denied")) {
        return res.status(404).json({ error: linkError.message });
      }
      throw linkError;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
});

// GET all photos for a specific memory
router.get("/:memoryId/photos", authenticateToken, async (req, res, next) => {
  const { memoryId } = req.params;
  const userId = req.user.userId;
  try {
    const memoryCheck = await pool.query(
      "SELECT id FROM memories WHERE id = $1 AND user_id = $2",
      [memoryId, userId]
    );
    if (memoryCheck.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Memory not found or access denied." });
    }
    const result = await pool.query(
      "SELECT p.id, p.file_path, p.created_at, p.width, p.height, p.captured_at, p.captured_place, mp.added_at FROM photos p JOIN memory_photos mp ON p.id = mp.photo_id WHERE mp.memory_id = $1 ORDER BY mp.added_at ASC",
      [memoryId]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// DELETE (unlink) a specific photo from a memory
router.delete(
  "/:memoryId/photos/:photoId",
  authenticateToken,
  async (req, res, next) => {
    const { memoryId, photoId } = req.params;
    const userId = req.user.userId;
    try {
      const memoryCheck = await pool.query(
        "SELECT id FROM memories WHERE id = $1 AND user_id = $2",
        [memoryId, userId]
      );
      if (memoryCheck.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Memory not found or access denied." });
      }
      const result = await pool.query(
        "DELETE FROM memory_photos WHERE memory_id = $1 AND photo_id = $2 RETURNING *",
        [memoryId, photoId]
      );
      if (result.rowCount === 0) {
        return res
          .status(404)
          .json({ error: "Photo link not found in this memory." });
      }
      res
        .status(200)
        .json({ message: "Photo unlinked from memory successfully." });
    } catch (error) {
      next(error);
    }
  }
);

// --- Share Links Routes ---

// Schema for creating a share link
const createShareLinkSchema = Joi.object({
  expires_at: Joi.date().iso().allow(null).optional(),
});

// POST /api/memories/:memoryId/share-links - Create a new share link for a memory
router.post(
  "/:memoryId/share-links",
  authenticateToken,
  async (req, res, next) => {
    const { memoryId } = req.params;
    const userId = req.user.userId;

    try {
      const { error, value } = createShareLinkSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }
      const { expires_at } = value;

      if (!(await checkMemoryOwnership(memoryId, userId))) {
        return res
          .status(404)
          .json({ error: "Memory not found or access denied." });
      }

      const token = uuidv4(); // Generate a unique token

      const result = await pool.query(
        "INSERT INTO share_links (token, memory_id, user_id, expires_at) VALUES ($1, $2, $3, $4) RETURNING id, token, expires_at, created_at, is_active",
        [token, memoryId, userId, expires_at || null]
      );

      const newShareLink = result.rows[0];
      // Construct the full URL. Replace with your actual frontend URL structure.
      const full_share_url = `${req.protocol}://${req.get("host")}/share/view/${
        newShareLink.token
      }`; // Adjust if frontend is on a different domain/port

      res.status(201).json({ ...newShareLink, full_share_url });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/memories/:memoryId/share-links - List all share links for a memory
router.get(
  "/:memoryId/share-links",
  authenticateToken,
  async (req, res, next) => {
    const { memoryId } = req.params;
    const userId = req.user.userId;

    try {
      if (!(await checkMemoryOwnership(memoryId, userId))) {
        return res
          .status(404)
          .json({ error: "Memory not found or access denied." });
      }

      const result = await pool.query(
        "SELECT id, token, created_at, expires_at, is_active FROM share_links WHERE memory_id = $1 AND user_id = $2 ORDER BY created_at DESC",
        [memoryId, userId]
      );

      const shareLinks = result.rows.map((link) => ({
        ...link,
        full_share_url: `${req.protocol}://${req.get("host")}/share/view/${
          link.token
        }`, // Adjust as needed
      }));

      res.json(shareLinks);
    } catch (error) {
      next(error);
    }
  }
);

// Schema for updating a share link
const updateShareLinkSchema = Joi.object({
  expires_at: Joi.date().iso().allow(null).optional(),
  is_active: Joi.boolean().optional(),
}).min(1);

// PUT /api/memories/share-links/:shareLinkId - Update a share link (e.g., expiration, active status)
router.put(
  "/share-links/:shareLinkId",
  authenticateToken,
  async (req, res, next) => {
    const { shareLinkId } = req.params;
    const userId = req.user.userId;

    try {
      const { error, value } = updateShareLinkSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }
      const { expires_at, is_active } = value;

      const fieldsToUpdate = [];
      const queryParams = [];
      let paramIndex = 1;

      if (expires_at !== undefined) {
        fieldsToUpdate.push(`expires_at = $${paramIndex++}`);
        queryParams.push(expires_at);
      }
      if (is_active !== undefined) {
        fieldsToUpdate.push(`is_active = $${paramIndex++}`);
        queryParams.push(is_active);
      }

      if (fieldsToUpdate.length === 0) {
        return res
          .status(400)
          .json({ error: "No valid fields provided for update." });
      }

      queryParams.push(shareLinkId, userId);

      const updateQuery = `UPDATE share_links SET ${fieldsToUpdate.join(
        ", "
      )} WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} RETURNING id, token, created_at, expires_at, is_active`;

      const result = await pool.query(updateQuery, queryParams);

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Share link not found or access denied." });
      }

      const updatedLink = result.rows[0];
      const full_share_url = `${req.protocol}://${req.get("host")}/share/view/${
        updatedLink.token
      }`;

      res.json({ ...updatedLink, full_share_url });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/memories/share-links/:shareLinkId - Revoke/Delete a share link
router.delete(
  "/share-links/:shareLinkId",
  authenticateToken,
  async (req, res, next) => {
    const { shareLinkId } = req.params;
    const userId = req.user.userId;

    try {
      const result = await pool.query(
        "DELETE FROM share_links WHERE id = $1 AND user_id = $2 RETURNING id",
        [shareLinkId, userId]
      );

      if (result.rowCount === 0) {
        return res
          .status(404)
          .json({ error: "Share link not found or access denied." });
      }
      res.status(204).send(); // No Content
    } catch (error) {
      next(error);
    }
  }
);

// --- Memory View Configurations ---

const memoryViewConfigBaseSchemaFields = {
  name: Joi.string().min(1).max(255),
  view_type: Joi.string().min(1).max(50),
  configuration_data: Joi.object().required(),
  is_primary_view: Joi.boolean().optional(),
  client_updated_at: Joi.string().isoDate().required(),
};

const createMemoryViewConfigSchema = Joi.object({
  ...memoryViewConfigBaseSchemaFields,
  name: memoryViewConfigBaseSchemaFields.name.required(),
  view_type: memoryViewConfigBaseSchemaFields.view_type.required(),
});

const updateMemoryViewConfigSchema = Joi.object({
  ...memoryViewConfigBaseSchemaFields,
  name: memoryViewConfigBaseSchemaFields.name.optional(),
  view_type: memoryViewConfigBaseSchemaFields.view_type.optional(), // Allowing view_type change
  configuration_data:
    memoryViewConfigBaseSchemaFields.configuration_data.optional(), // Make optional for partial updates
  is_primary_view: memoryViewConfigBaseSchemaFields.is_primary_view.optional(),
  // client_updated_at is required for the update operation itself
});

// POST create a new view configuration for a memory
router.post(
  "/:memoryId/view-configurations",
  authenticateToken,
  async (req, res, next) => {
    const { memoryId } = req.params;
    const userId = req.user.userId;

    try {
      const { error, value } = createMemoryViewConfigSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const {
        name,
        view_type,
        configuration_data,
        is_primary_view = false,
        client_updated_at,
      } = value;

      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        if (!(await checkMemoryOwnership(memoryId, userId))) {
          await client.query("ROLLBACK");
          return res
            .status(404)
            .json({ error: "Memory not found or access denied." });
        }

        if (is_primary_view) {
          await client.query(
            "UPDATE memory_view_configurations SET is_primary_view = false WHERE memory_id = $1 AND view_type = $2 AND user_id = $3",
            [memoryId, view_type, userId]
          );
        }

        const result = await client.query(
          "INSERT INTO memory_view_configurations (memory_id, user_id, name, view_type, configuration_data, is_primary_view, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $7) RETURNING *",
          [
            memoryId,
            userId,
            name,
            view_type,
            configuration_data,
            is_primary_view,
            client_updated_at, // Use client_updated_at for both created_at and updated_at
          ]
        );

        await client.query(
          "UPDATE memories SET updated_at = $1 WHERE id = $2 AND user_id = $3",
          [client_updated_at, memoryId, userId]
        );

        await client.query("COMMIT");
        res.status(201).json(result.rows[0]);
      } catch (transactionError) {
        await client.query("ROLLBACK");
        next(transactionError);
      } finally {
        client.release();
      }
    } catch (e) {
      next(e); // Catch errors from Joi validation or if client.connect() fails
    }
  }
);

// PUT update an existing view configuration
router.put(
  "/:memoryId/view-configurations/:configId",
  authenticateToken,
  async (req, res, next) => {
    const { memoryId, configId } = req.params;
    const userId = req.user.userId;

    try {
      const { error, value } = updateMemoryViewConfigSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const {
        name,
        view_type,
        configuration_data,
        is_primary_view,
        client_updated_at,
      } = value;

      // Ensure at least one modifiable field is present besides client_updated_at
      const updateKeys = Object.keys(value).filter(
        (key) => key !== "client_updated_at"
      );
      if (updateKeys.length === 0) {
        return res.status(400).json({
          error:
            "No update fields provided beyond timestamp. At least one of 'name', 'view_type', 'configuration_data', or 'is_primary_view' must be present.",
        });
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        if (!(await checkMemoryOwnership(memoryId, userId))) {
          await client.query("ROLLBACK");
          return res
            .status(404)
            .json({ error: "Memory not found or access denied." });
        }

        const currentConfigResult = await client.query(
          "SELECT view_type FROM memory_view_configurations WHERE id = $1 AND memory_id = $2 AND user_id = $3",
          [configId, memoryId, userId]
        );

        if (currentConfigResult.rows.length === 0) {
          await client.query("ROLLBACK");
          return res
            .status(404)
            .json({ error: "View configuration not found or access denied." });
        }
        const currentViewType = currentConfigResult.rows[0].view_type;

        const updateFields = [];
        const queryParams = [];
        let paramIndex = 1;

        if (name !== undefined) {
          updateFields.push(`name = $${paramIndex++}`);
          queryParams.push(name);
        }

        const effectiveViewType =
          view_type !== undefined ? view_type : currentViewType;

        if (view_type !== undefined) {
          updateFields.push(`view_type = $${paramIndex++}`);
          queryParams.push(view_type);
        }
        if (configuration_data !== undefined) {
          updateFields.push(`configuration_data = $${paramIndex++}`);
          queryParams.push(configuration_data);
        }

        if (is_primary_view !== undefined) {
          updateFields.push(`is_primary_view = $${paramIndex++}`);
          queryParams.push(is_primary_view);

          if (is_primary_view) {
            // If setting this as primary, unset other primary views of the same effective type for this memory
            await client.query(
              "UPDATE memory_view_configurations SET is_primary_view = false WHERE memory_id = $1 AND view_type = $2 AND id != $3 AND user_id = $4",
              [memoryId, effectiveViewType, configId, userId]
            );
          }
        }

        // Always update the updated_at timestamp using client_updated_at
        updateFields.push(`updated_at = $${paramIndex++}`);
        queryParams.push(client_updated_at);

        // Add WHERE clause parameters
        queryParams.push(configId, memoryId, userId);

        const updateQuery = `UPDATE memory_view_configurations SET ${updateFields.join(
          ", "
        )} WHERE id = $${paramIndex++} AND memory_id = $${paramIndex++} AND user_id = $${paramIndex++} RETURNING *`;

        const result = await client.query(updateQuery, queryParams);

        if (result.rows.length === 0) {
          await client.query("ROLLBACK");
          // This case implies the record was not found or not owned, though initial checks should catch this.
          return res.status(404).json({
            error:
              "View configuration update failed or record not found post-update.",
          });
        }

        // Update the parent memory's updated_at timestamp
        await client.query(
          "UPDATE memories SET updated_at = $1 WHERE id = $2 AND user_id = $3",
          [client_updated_at, memoryId, userId]
        );

        await client.query("COMMIT");
        res.json(result.rows[0]);
      } catch (transactionError) {
        await client.query("ROLLBACK");
        next(transactionError);
      } finally {
        client.release();
      }
    } catch (e) {
      next(e); // Catch errors from Joi validation or if client.connect() fails
    }
  }
);

export default router;
