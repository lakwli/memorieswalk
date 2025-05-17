import express from "express";
import pool from "../db.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs"; // For checking file existence

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// GET /api/public/memories/view/:token (View Shared Memory - Public, No Auth)
router.get("/memories/view/:token", async (req, res, next) => {
  const { token } = req.params;

  try {
    // Step 1: Find the share_links record by the provided token
    const shareLinkResult = await pool.query(
      "SELECT id, memory_id, expires_at, is_active FROM share_links WHERE token = $1",
      [token]
    );

    if (shareLinkResult.rows.length === 0) {
      return res.status(404).json({ error: "Share link not found." });
    }

    const shareLink = shareLinkResult.rows[0];

    // Step 2: Validate Link
    if (!shareLink.is_active) {
      return res.status(410).json({ error: "Share link is no longer active." });
    }
    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      // Optionally, update is_active to false in the DB if it's past expiration
      // await pool.query("UPDATE share_links SET is_active = false WHERE id = $1", [shareLink.id]);
      return res.status(410).json({ error: "Share link has expired." });
    }

    const memoryId = shareLink.memory_id;

    // Step 3: Fetch the memory details
    const memoryResult = await pool.query(
      "SELECT id, user_id, title, description, thumbnail_url, created_at, updated_at FROM memories WHERE id = $1",
      [memoryId]
    );

    if (memoryResult.rows.length === 0) {
      // This should ideally not happen if share_link.memory_id is valid
      return res.status(404).json({ error: "Shared memory not found." });
    }
    const memory = memoryResult.rows[0];

    // Step 4: Fetch associated photos for the memory
    const photosResult = await pool.query(
      `SELECT p.id, p.file_path, p.captured_at, p.width, p.height, p.mime_type
       FROM photos p
       JOIN memory_photos mp ON p.id = mp.photo_id
       WHERE mp.memory_id = $1
       ORDER BY mp.added_at ASC`,
      [memoryId]
    );

    // Construct public URLs for photos. These will point to our new public photo serving endpoint.
    memory.photos = photosResult.rows.map(photo => ({
      ...photo,
      // The URL the frontend will use to request the photo via the public share mechanism
      public_url: `/api/public/photos/view/${photo.id}?shareToken=${token}`
    }));
    
    // Step 5: Fetch the primary view configuration for the memory
    const primaryViewResult = await pool.query(
      `SELECT id, name, view_type, configuration_data, updated_at
       FROM memory_view_configurations
       WHERE memory_id = $1 AND is_primary_view = TRUE`,
      [memoryId]
    );

    if (primaryViewResult.rows.length > 0) {
      memory.primary_view_configuration = primaryViewResult.rows[0];
    } else {
      memory.primary_view_configuration = null; // Or omit if preferred
    }
    
    // Remove sensitive data like user_id from the public response if necessary
    delete memory.user_id; 

    res.json(memory);
  } catch (error) {
    console.error(`Error fetching shared memory for token ${token}:`, error);
    next(error);
  }
});

// GET /api/public/photos/view/:photoId?shareToken=<token> (View Shared Photo - Public, No Auth)
router.get("/photos/view/:photoId", async (req, res, next) => {
  const { photoId } = req.params;
  const { shareToken } = req.query;

  if (!shareToken) {
    return res.status(400).json({ error: "Share token is required to view this photo." });
  }

  try {
    // Step 1: Validate the shareToken
    const shareLinkResult = await pool.query(
      "SELECT memory_id, expires_at, is_active FROM share_links WHERE token = $1",
      [shareToken]
    );

    if (shareLinkResult.rows.length === 0) {
      return res.status(404).json({ error: "Invalid share token." });
    }
    const shareLink = shareLinkResult.rows[0];

    if (!shareLink.is_active || (shareLink.expires_at && new Date(shareLink.expires_at) < new Date())) {
      return res.status(410).json({ error: "Share link is not active or has expired." });
    }

    const memoryIdFromShareToken = shareLink.memory_id;

    // Step 2: Get photo details and verify it belongs to the shared memory
    const photoResult = await pool.query(
      `SELECT p.file_path, p.mime_type
       FROM photos p
       JOIN memory_photos mp ON p.id = mp.photo_id
       WHERE p.id = $1 AND mp.memory_id = $2`,
      [photoId, memoryIdFromShareToken]
    );

    if (photoResult.rows.length === 0) {
      return res.status(404).json({ error: "Photo not found in this shared memory or access denied." });
    }

    const photoData = photoResult.rows[0];
    const relativeFilePathInDb = photoData.file_path;
    
    // Photos are stored in /workspace/server/file_storage/photos/
    // The file_path in DB is relative to this, e.g., "firstPartOfUuid/photoId.webp"
    // Adjusted path to be relative to this file's location in routes/
    const basePrivatePhotoDir = path.join(__dirname, "../file_storage/photos"); 
    const absoluteFilePath = path.join(basePrivatePhotoDir, relativeFilePathInDb);

    if (fs.existsSync(absoluteFilePath)) {
      res.setHeader('Content-Type', photoData.mime_type || 'image/webp');
      res.sendFile(absoluteFilePath);
    } else {
      console.error(`Shared photo file not found for photoId ${photoId} at ${absoluteFilePath} via shareToken ${shareToken}`);
      return res.status(404).json({ error: "Photo file not found on server." });
    }
  } catch (error) {
    console.error(`Error serving shared photo ${photoId} with token ${shareToken}:`, error);
    next(error);
  }
});


export default router;
