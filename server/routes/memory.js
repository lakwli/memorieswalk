import express from "express";
import pool from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import { processImage, deleteFile } from "../utils/fileUtils.js";
import { v4 as uuidv4 } from "uuid";
import Joi from "joi";
import canvasViewOptimizer from "../utils/canvasViewOptimizer.js";

const router = express.Router();

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
      "SELECT id, name, view_type, is_primary_view, updated_at FROM memory_view_configurations WHERE memory_id = $1 ORDER BY name ASC",
      [memoryId]
    );
    memory.view_configurations = viewsResult.rows;

    res.json(memory);
  } catch (error) {
    next(error);
  }
});

// PUT update a memory's core details
const updateMemorySchema = Joi.object({
  title: Joi.string().min(1).max(255).optional(),
  description: Joi.string().allow("").optional(),
  thumbnail_url: Joi.string().uri().allow(null, "").optional(),
});
router.put("/:memoryId", authenticateToken, async (req, res, next) => {
  const { memoryId } = req.params;
  try {
    const { error, value } = updateMemorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { title, description, thumbnail_url } = value;
    if (Object.keys(value).length === 0) {
      return res.status(400).json({ error: "No update fields provided." });
    }

    const memoryCheck = await pool.query(
      "SELECT id FROM memories WHERE id = $1 AND user_id = $2",
      [memoryId, req.user.userId]
    );
    if (memoryCheck.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Memory not found or access denied." });
    }

    const updateFields = [];
    const queryParams = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`);
      queryParams.push(title);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      queryParams.push(description);
    }
    if (thumbnail_url !== undefined) {
      updateFields.push(`thumbnail_url = $${paramIndex++}`);
      queryParams.push(thumbnail_url);
    }

    if (updateFields.length === 0) {
      return res
        .status(400)
        .json({ error: "No valid fields to update provided." });
    }

    queryParams.push(memoryId, req.user.userId);
    const updateQuery = `UPDATE memories SET ${updateFields.join(
      ", "
    )}, updated_at = NOW() WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} RETURNING *`;

    const updatedMemoryResult = await pool.query(updateQuery, queryParams);
    res.json(updatedMemoryResult.rows[0]);
  } catch (error) {
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
      return res
        .status(400)
        .json({
          error: `Invalid photo metadata: ${bodyError.details[0].message}`,
        });
    }

    const userId = req.user.userId;
    const photoProcessingPromises = req.files.map(async (file) => {
      try {
        const photoId = uuidv4();
        const processedAbsolutePath = await processImage(
          file.path,
          photoId.split("-")[0]
        );

        const publicDirPattern = new RegExp(`^.*/server/public/`);
        const relativePathForDb = processedAbsolutePath.replace(
          publicDirPattern,
          ""
        );

        const dbResult = await pool.query(
          "INSERT INTO photos (id, user_id, file_path, mime_type, size_bytes, width, height, captured_at, location_lat, location_lng, captured_place, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id, file_path, created_at",
          [
            photoId,
            userId,
            relativePathForDb,
            file.mimetype,
            file.size,
            null,
            null,
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
    const absoluteFilePathToDelete = `/workspace/server/public/${relativeFilePathInDb}`;

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
    res
      .status(200)
      .json({
        message: "Photo deleted successfully and unlinked from all memories.",
      });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    next(error);
  } finally {
    if (client) client.release();
  }
});

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

// --- Memory View Configurations Routes ---

const viewConfigBaseSchema = {
  name: Joi.string().min(1).max(255).required(),
  view_type: Joi.string()
    .valid("canvas", "grid", "map", "timeline", "list")
    .required(),
  is_primary_view: Joi.boolean().optional(),
};

const canvasConfigSchema = Joi.object({
  objects: Joi.array().items(Joi.object()).optional().default([]),
  layers: Joi.array().items(Joi.string()).optional().default([]),
  viewport: Joi.object().optional(),
}).default({ objects: [], layers: [] });

const viewConfigurationSchema = Joi.object({
  ...viewConfigBaseSchema,
  configuration_data: Joi.when("view_type", {
    is: "canvas",
    then: canvasConfigSchema.required(),
    otherwise: Joi.object().required(),
  }),
});

// POST create a new view configuration for a memory
router.post("/:memoryId/views", authenticateToken, async (req, res, next) => {
  const { memoryId } = req.params;
  const userId = req.user.userId;

  try {
    const { error, value } = viewConfigurationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const memoryCheck = await pool.query(
      "SELECT id FROM memories WHERE id = $1 AND user_id = $2",
      [memoryId, userId]
    );
    if (memoryCheck.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Memory not found or access denied." });
    }

    let { name, view_type, configuration_data, is_primary_view } = value;

    if (view_type === "canvas") {
      configuration_data = canvasViewOptimizer.optimize(configuration_data);
      const dataSize = canvasViewOptimizer.getSize(configuration_data);
      const maxSize = 10 * 1024 * 1024;
      if (dataSize > maxSize) {
        return res.status(413).json({
          message: `Canvas data too large (${(dataSize / (1024 * 1024)).toFixed(
            2
          )}MB). Max size is ${(maxSize / (1024 * 1024)).toFixed(2)}MB.`,
          size: dataSize,
          limit: maxSize,
        });
      }
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      if (is_primary_view) {
        await client.query(
          "UPDATE memory_view_configurations SET is_primary_view = FALSE WHERE memory_id = $1 AND user_id = $2",
          [memoryId, userId]
        );
      }

      const result = await client.query(
        "INSERT INTO memory_view_configurations (memory_id, user_id, name, view_type, configuration_data, is_primary_view) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [
          memoryId,
          userId,
          name,
          view_type,
          configuration_data,
          is_primary_view === undefined ? false : is_primary_view,
        ]
      );
      await client.query("COMMIT");
      res.status(201).json(result.rows[0]);
    } catch (dbError) {
      await client.query("ROLLBACK");
      if (
        dbError.code === "23505" &&
        dbError.constraint === "idx_unique_primary_view_per_memory"
      ) {
        return res
          .status(409)
          .json({
            error:
              "Failed to set primary view. Another view might already be primary due to a concurrent update. Please try again or ensure no other view is primary.",
          });
      }
      throw dbError;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
});

// GET all view configurations for a memory
router.get("/:memoryId/views", authenticateToken, async (req, res, next) => {
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
      "SELECT * FROM memory_view_configurations WHERE memory_id = $1 AND user_id = $2 ORDER BY name ASC",
      [memoryId, userId]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// GET a specific view configuration
router.get(
  "/:memoryId/views/:viewId",
  authenticateToken,
  async (req, res, next) => {
    const { memoryId, viewId } = req.params;
    const userId = req.user.userId;
    try {
      const result = await pool.query(
        "SELECT * FROM memory_view_configurations WHERE id = $1 AND memory_id = $2 AND user_id = $3",
        [viewId, memoryId, userId]
      );
      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "View configuration not found or access denied." });
      }
      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

// PUT update a specific view configuration
const updateViewConfigurationSchema = Joi.object({
  ...viewConfigBaseSchema,
  configuration_data: Joi.when("view_type", {
    is: "canvas",
    then: canvasConfigSchema.optional(),
    otherwise: Joi.object().optional(),
  }),
}).min(1);

router.put(
  "/:memoryId/views/:viewId",
  authenticateToken,
  async (req, res, next) => {
    const { memoryId, viewId } = req.params;
    const userId = req.user.userId;

    try {
      const { error, value } = updateViewConfigurationSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const currentView = await pool.query(
        "SELECT view_type FROM memory_view_configurations WHERE id = $1 AND memory_id = $2 AND user_id = $3",
        [viewId, memoryId, userId]
      );
      if (currentView.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "View configuration not found or access denied." });
      }
      const actualViewType = currentView.rows[0].view_type;

      const newViewType = value.view_type || actualViewType;
      let configuration_data = value.configuration_data;

      if (
        value.view_type &&
        value.view_type !== actualViewType &&
        !value.configuration_data
      ) {
        return res
          .status(400)
          .json({
            error: `Configuration data is required when changing view_type to '${value.view_type}'.`,
          });
      }

      if (
        configuration_data ||
        (value.view_type && value.view_type !== actualViewType)
      ) {
        let specificSchema;
        if (newViewType === "canvas") specificSchema = canvasConfigSchema;
        else specificSchema = Joi.object();

        const { error: configError } = specificSchema
          .required()
          .validate(configuration_data);
        if (configError) {
          return res
            .status(400)
            .json({
              error: `Invalid configuration_data for view_type '${newViewType}': ${configError.details[0].message}`,
            });
        }
      }

      if (newViewType === "canvas" && configuration_data) {
        configuration_data = canvasViewOptimizer.optimize(configuration_data);
        const dataSize = canvasViewOptimizer.getSize(configuration_data);
        const maxSize = 10 * 1024 * 1024;
        if (dataSize > maxSize) {
          return res.status(413).json({
            message: `Canvas data too large (${(
              dataSize /
              (1024 * 1024)
            ).toFixed(2)}MB). Max size is ${(maxSize / (1024 * 1024)).toFixed(
              2
            )}MB.`,
            size: dataSize,
            limit: maxSize,
          });
        }
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        if (value.is_primary_view === true) {
          await client.query(
            "UPDATE memory_view_configurations SET is_primary_view = FALSE WHERE memory_id = $1 AND user_id = $2 AND id != $3",
            [memoryId, userId, viewId]
          );
        }

        const setClauses = [];
        const queryParams = [];
        let paramIndex = 1;

        if (value.name !== undefined) {
          setClauses.push(`name = $${paramIndex++}`);
          queryParams.push(value.name);
        }
        if (value.view_type !== undefined) {
          setClauses.push(`view_type = $${paramIndex++}`);
          queryParams.push(value.view_type);
        }
        if (configuration_data !== undefined) {
          setClauses.push(`configuration_data = $${paramIndex++}`);
          queryParams.push(configuration_data);
        }
        if (value.is_primary_view !== undefined) {
          setClauses.push(`is_primary_view = $${paramIndex++}`);
          queryParams.push(value.is_primary_view);
        }

        if (setClauses.length === 0) {
          await client.query("ROLLBACK");
          client.release();
          return res.status(304).send();
        }

        setClauses.push("updated_at = NOW()");
        queryParams.push(viewId, memoryId, userId);

        const updateQuery = `UPDATE memory_view_configurations SET ${setClauses.join(
          ", "
        )} WHERE id = $${paramIndex++} AND memory_id = $${paramIndex++} AND user_id = $${paramIndex++} RETURNING *`;

        const result = await client.query(updateQuery, queryParams);

        if (result.rows.length === 0) {
          await client.query("ROLLBACK");
          client.release();
          return res
            .status(404)
            .json({
              error:
                "View configuration not found during update, or access denied.",
            });
        }

        await client.query("COMMIT");
        res.json(result.rows[0]);
      } catch (dbError) {
        await client.query("ROLLBACK");
        if (
          dbError.code === "23505" &&
          dbError.constraint === "idx_unique_primary_view_per_memory"
        ) {
          return res
            .status(409)
            .json({
              error:
                "Failed to set primary view. Another view might already be primary due to a concurrent update. Please try again or ensure no other view is primary.",
            });
        }
        throw dbError;
      } finally {
        client.release();
      }
    } catch (error) {
      next(error);
    }
  }
);

// DELETE a specific view configuration
router.delete(
  "/:memoryId/views/:viewId",
  authenticateToken,
  async (req, res, next) => {
    const { memoryId, viewId } = req.params;
    const userId = req.user.userId;
    try {
      const result = await pool.query(
        "DELETE FROM memory_view_configurations WHERE id = $1 AND memory_id = $2 AND user_id = $3 RETURNING id",
        [viewId, memoryId, userId]
      );
      if (result.rowCount === 0) {
        return res
          .status(404)
          .json({ error: "View configuration not found or access denied." });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
