import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { pool } from "../db.js";
import photoService from "../services/photoService.js";

const router = express.Router();

/**
 * Check if user owns the memory
 * @param {string} memoryId - Memory ID to check
 * @param {string} userId - User ID to verify against
 * @param {Object} client - Database client for transaction
 * @returns {Promise<boolean>} True if user owns memory, false otherwise
 */
async function checkMemoryOwnership(memoryId, userId, client) {
  const result = await client.query(
    "SELECT EXISTS(SELECT 1 FROM memories WHERE id = $1 AND user_id = $2)",
    [memoryId, userId]
  );
  return result.rows[0].exists;
}

// Get all memories for the authenticated user
router.get("/", authenticateToken, async (req, res, next) => {
  try {
    console.log("Fetching memories for user:", req.user.userId);
    const result = await pool.query(
      `SELECT m.id, m.title, m.description, m.thumbnail_url, m.created_at, m.updated_at, 
                    COUNT(DISTINCT mp.photo_id) AS photo_count, 
                    COUNT(DISTINCT mvc.id) AS view_config_count 
             FROM memories m 
             LEFT JOIN memory_photos mp ON m.id = mp.memory_id 
             LEFT JOIN memory_view_configurations mvc ON m.id = mvc.memory_id 
             WHERE m.user_id = $1 
             GROUP BY m.id 
             ORDER BY m.created_at DESC`,
      [req.user.userId]
    );
    console.log("Memories query result:", result.rows.length, "memories found");
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Create new memory
router.post("/", authenticateToken, async (req, res, next) => {
  const { title, description } = req.body;
  const userId = req.user.userId;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Create memory
    const memoryResult = await client.query(
      "INSERT INTO memories (user_id, title, description) VALUES ($1, $2, $3) RETURNING id",
      [userId, title, description]
    );

    const memoryId = memoryResult.rows[0].id;

    // Create default canvas configuration
    await client.query(
      "INSERT INTO memory_view_configurations (memory_id, user_id, name, view_type, configuration_data) VALUES ($1, $2, $3, $4, $5)",
      [memoryId, req.user.userId, "Default View", "canvas", {}]
    );

    await client.query("COMMIT");

    const result = await pool.query("SELECT * FROM memories WHERE id = $1", [
      memoryId,
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
});

// Get a specific memory by ID
router.get("/:id", authenticateToken, async (req, res, next) => {
  const { id: memoryId } = req.params;
  const userId = req.user.userId;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Check ownership
    const hasAccess = await checkMemoryOwnership(memoryId, userId, client);
    if (!hasAccess) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ error: "Memory not found or access denied." });
    }

    // Get memory details
    const memoryResult = await client.query(
      `SELECT m.*, mvc.configuration_data as canvas_config
             FROM memories m
             LEFT JOIN memory_view_configurations mvc ON m.id = mvc.memory_id
             WHERE m.id = $1`,
      [memoryId]
    );

    const memory = memoryResult.rows[0];

    // Get associated photos
    const photosResult = await client.query(
      `SELECT p.id, p.file_path, p.captured_at, p.width, p.height 
             FROM photos p 
             JOIN memory_photos mp ON p.id = mp.photo_id 
             WHERE mp.memory_id = $1 
             ORDER BY mp.added_at ASC`,
      [memoryId]
    );
    memory.photos = photosResult.rows.map((photo) => ({
      ...photo,
      state: "P", // Mark as permanent since they're from the database
    }));

    await client.query("COMMIT");
    res.json(memory);
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
});

// Update memory
router.put("/:id", authenticateToken, async (req, res, next) => {
  const { id: memoryId } = req.params;
  const userId = req.user.userId;
  const client = await pool.connect();

  console.log("Memory update request received:", {
    memoryId,
    userId,
    body: JSON.stringify(req.body, null, 2),
  });

  try {
    await client.query("BEGIN");

    // Check ownership
    const hasAccess = await checkMemoryOwnership(memoryId, userId, client);
    if (!hasAccess) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ error: "Memory not found or access denied." });
    }

    const { title, description, canvas } = req.body;
    console.log("Received canvas data:", canvas);

    // Extract photos from canvas configuration
    const photos = canvas?.photos || [];
    console.log("Extracted photos:", photos);

    // 1. Update memory details
    await client.query(
      "UPDATE memories SET title = $1, description = $2, updated_at = NOW() WHERE id = $3",
      [title, description, memoryId]
    );

    // 2. Update canvas configuration
    await client.query(
      "UPDATE memory_view_configurations SET configuration_data = $1 WHERE memory_id = $2",
      [canvas, memoryId]
    );

    // 3. Process photos based on their states
    if (Array.isArray(photos)) {
      console.log("Processing photos:", {
        totalPhotos: photos.length,
        photoStates: photos.map((p) => ({ id: p.id, state: p.state })),
      });

      // Handle new photos (N)
      const newPhotos = photos.filter((p) => p.state === "N");
      console.log("New photos to process:", {
        count: newPhotos.length,
        ids: newPhotos.map((p) => p.id),
      });
      for (const photo of newPhotos) {
        const filePath = `${photo.id.split("-")[0]}/${photo.id}.webp`;
        console.log(
          `Processing photo ${photo.id} - step 1: Creating photo record`
        );

        // Insert photo record with RETURNING
        const photoResult = await client.query(
          `INSERT INTO photos (
            id, user_id, file_path, mime_type, width, height,
            size_bytes, metadata, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
          RETURNING id, file_path, width, height, size_bytes`,
          [
            photo.id,
            userId,
            filePath,
            "image/webp",
            photo.originalWidth,
            photo.originalHeight,
            photo.size,
            JSON.stringify({
              displayWidth: photo.width,
              displayHeight: photo.height,
              uploadTimestamp: new Date().toISOString(),
            }),
          ]
        );
        console.log(
          `Photo ${photo.id} - DB record result:`,
          photoResult.rows[0]
        );

        console.log(
          `Photo ${photo.id} - step 2: Photo record created, inserting memory link`
        );

        // Create memory-photo link with RETURNING
        const linkResult = await client.query(
          "INSERT INTO memory_photos (memory_id, photo_id, added_at) VALUES ($1, $2, NOW()) RETURNING *",
          [memoryId, photo.id]
        );
        console.log(
          `Photo ${photo.id} - Memory link result:`,
          linkResult.rows[0]
        );

        console.log(
          `Photo ${photo.id} - step 3: Memory link created, moving to permanent storage`
        );

        // Move to permanent storage
        await photoService.makePermanent(photo.id);

        console.log(`Photo ${photo.id} - step 4: Processing complete`);
      }

      // Handle removed photos (R)
      const removedPhotos = photos.filter((p) => p.state === "R");
      for (const photo of removedPhotos) {
        // Remove memory-photo link
        await client.query(
          "DELETE FROM memory_photos WHERE memory_id = $1 AND photo_id = $2",
          [memoryId, photo.id]
        );

        // Check if photo has other memory links
        const linksResult = await client.query(
          "SELECT COUNT(*) as link_count FROM memory_photos WHERE photo_id = $1",
          [photo.id]
        );

        // If no other links exist, remove the photo completely
        if (linksResult.rows[0].link_count === 0) {
          await client.query("DELETE FROM photos WHERE id = $1", [photo.id]);
          await photoService.removePermanent(photo.id);
        }
      }
    }

    // Query to verify the saved data with more details
    const verifyResult = await client.query(
      `SELECT p.id, p.file_path, p.width, p.height, p.size_bytes, mp.memory_id, mp.added_at
       FROM photos p
       JOIN memory_photos mp ON p.id = mp.photo_id
       WHERE mp.memory_id = $1`,
      [memoryId]
    );
    console.log("Verification after save:", {
      savedPhotos: verifyResult.rows,
    });
    console.log("Transaction completed successfully");
    await client.query("COMMIT");

    // Return updated memory data
    const updatedMemory = await client.query(
      `SELECT m.*,
                    array_agg(DISTINCT mp.photo_id) as photo_ids,
                    mvc.configuration_data as canvas_config
             FROM memories m
             LEFT JOIN memory_photos mp ON m.id = mp.memory_id
             LEFT JOIN memory_view_configurations mvc ON m.id = mvc.memory_id
             WHERE m.id = $1
             GROUP BY m.id, mvc.configuration_data`,
      [memoryId]
    );

    res.json(updatedMemory.rows[0]);
  } catch (error) {
    console.error("Error in memory update:", {
      error: error.message,
      stack: error.stack,
    });
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
});

// Delete memory
router.delete("/:id", authenticateToken, async (req, res, next) => {
  const { id: memoryId } = req.params;
  const userId = req.user.userId;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Check ownership
    const hasAccess = await checkMemoryOwnership(memoryId, userId, client);
    if (!hasAccess) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ error: "Memory not found or access denied." });
    }

    // Get photos to check for cleanup
    const photosResult = await client.query(
      "SELECT photo_id FROM memory_photos WHERE memory_id = $1",
      [memoryId]
    );

    // Delete memory (this will cascade to memory_photos and memory_view_configurations)
    await client.query("DELETE FROM memories WHERE id = $1", [memoryId]);

    // Check each photo if it needs cleanup
    for (const row of photosResult.rows) {
      const photoId = row.photo_id;

      const linksResult = await client.query(
        "SELECT COUNT(*) as link_count FROM memory_photos WHERE photo_id = $1",
        [photoId]
      );

      if (linksResult.rows[0].link_count === 0) {
        await client.query("DELETE FROM photos WHERE id = $1", [photoId]);
        await photoService.removePermanent(photoId);
      }
    }

    await client.query("COMMIT");
    res.status(204).send();
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
});

export default router;
