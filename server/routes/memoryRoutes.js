import express from "express";
import pool from "../db.js"; // PostgreSQL pool
import { authenticateToken } from "../auth.js"; // Authentication middleware

const router = express.Router();

// POST /api/memories - Create a new memory
router.post("/", authenticateToken, async (req, res) => {
  const { title, viewType = "canvas" } = req.body;
  const userId = req.user.userId; // Extracted from JWT by authenticateToken

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    const newMemory = await pool.query(
      "INSERT INTO memories (user_id, title, memory_data, thumbnail_url, view_type) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [userId, title, null, null, viewType] // Initial memory_data and thumbnail_url are null
    );
    res.status(201).json(newMemory.rows[0]);
  } catch (err) {
    console.error("Error creating memory:", err.message);
    res.status(500).json({ error: "Server error while creating memory" });
  }
});

// GET /api/memories - List memories for the authenticated user
router.get("/", authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const userMemories = await pool.query(
      "SELECT id, title, thumbnail_url, view_type, updated_at FROM memories WHERE user_id = $1 ORDER BY updated_at DESC",
      [userId]
    );
    res.json(userMemories.rows);
  } catch (err) {
    console.error("Error fetching memories:", err.message);
    res.status(500).json({ error: "Server error while fetching memories" });
  }
});

// Middleware to check memory ownership
const checkMemoryOwnership = async (req, res, next) => {
  const memoryId = parseInt(req.params.id);
  const userId = req.user.userId;

  if (isNaN(memoryId)) {
    return res.status(400).json({ error: "Invalid memory ID" });
  }

  try {
    const memory = await pool.query(
      "SELECT user_id FROM memories WHERE id = $1",
      [memoryId]
    );

    if (memory.rows.length === 0) {
      return res.status(404).json({ error: "Memory not found" });
    }

    if (memory.rows[0].user_id !== userId) {
      return res
        .status(403)
        .json({ error: "You don't have permission to access this memory" });
    }

    next();
  } catch (err) {
    console.error("Error checking memory ownership:", err.message);
    res.status(500).json({ error: "Server error while checking permissions" });
  }
};

// GET /api/memories/:id - Get a specific memory
router.get(
  "/:id",
  authenticateToken,
  checkMemoryOwnership,
  async (req, res) => {
    const memoryId = parseInt(req.params.id);

    try {
      const memory = await pool.query("SELECT * FROM memories WHERE id = $1", [
        memoryId,
      ]);
      res.json(memory.rows[0]);
    } catch (err) {
      console.error(`Error fetching memory ${memoryId}:`, err.message);
      res.status(500).json({ error: "Server error while fetching memory" });
    }
  }
);

// PUT /api/memories/:id - Update a memory
router.put(
  "/:id",
  authenticateToken,
  checkMemoryOwnership,
  async (req, res) => {
    const memoryId = parseInt(req.params.id);
    const { title, memory_data, thumbnail_url, view_type } = req.body;

    try {
      const updateMemory = await pool.query(
        `UPDATE memories 
       SET title = COALESCE($1, title), 
           memory_data = COALESCE($2, memory_data), 
           thumbnail_url = COALESCE($3, thumbnail_url),
           view_type = COALESCE($4, view_type),
           updated_at = NOW() 
       WHERE id = $5 
       RETURNING *`,
        [title, memory_data, thumbnail_url, view_type, memoryId]
      );
      res.json(updateMemory.rows[0]);
    } catch (err) {
      console.error(`Error updating memory ${memoryId}:`, err.message);
      res.status(500).json({ error: "Server error while updating memory" });
    }
  }
);

// DELETE /api/memories/:id - Delete a memory
router.delete(
  "/:id",
  authenticateToken,
  checkMemoryOwnership,
  async (req, res) => {
    const memoryId = parseInt(req.params.id);

    try {
      await pool.query("DELETE FROM memories WHERE id = $1", [memoryId]);
      res.json({ message: "Memory deleted successfully" });
    } catch (err) {
      console.error(`Error deleting memory ${memoryId}:`, err.message);
      res.status(500).json({ error: "Server error while deleting memory" });
    }
  }
);

// POST /api/memories/:id/photos - Add photos to a memory
router.post(
  "/:id/photos",
  authenticateToken,
  checkMemoryOwnership,
  async (req, res) => {
    const memoryId = parseInt(req.params.id);
    const {
      file_path,
      location_lat,
      location_lng,
      captured_place,
      captured_at,
      metadata,
    } = req.body;

    if (!file_path) {
      return res.status(400).json({ error: "File path is required" });
    }

    try {
      const newPhoto = await pool.query(
        `INSERT INTO photos (
        memory_id, file_path, location_lat, location_lng, 
        captured_place, captured_at, metadata
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
        [
          memoryId,
          file_path,
          location_lat,
          location_lng,
          captured_place,
          captured_at,
          metadata,
        ]
      );

      res.status(201).json(newPhoto.rows[0]);
    } catch (err) {
      console.error("Error adding photo:", err.message);
      res.status(500).json({ error: "Server error while adding photo" });
    }
  }
);

// GET /api/memories/:id/photos - Get all photos for a memory
router.get(
  "/:id/photos",
  authenticateToken,
  checkMemoryOwnership,
  async (req, res) => {
    const memoryId = parseInt(req.params.id);

    try {
      const photos = await pool.query(
        "SELECT * FROM photos WHERE memory_id = $1 ORDER BY created_at ASC",
        [memoryId]
      );
      res.json(photos.rows);
    } catch (err) {
      console.error(
        `Error fetching photos for memory ${memoryId}:`,
        err.message
      );
      res.status(500).json({ error: "Server error while fetching photos" });
    }
  }
);

// GET /api/memories/:id/share - Create a share link for a memory
router.post(
  "/:id/share",
  authenticateToken,
  checkMemoryOwnership,
  async (req, res) => {
    const memoryId = parseInt(req.params.id);
    const { expires_at, allow_downloads } = req.body;

    try {
      // Generate a random token
      const token =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

      const shareLink = await pool.query(
        `INSERT INTO share_links 
       (memory_id, token, expires_at, allow_downloads) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
        [memoryId, token, expires_at, allow_downloads || false]
      );

      res.status(201).json(shareLink.rows[0]);
    } catch (err) {
      console.error(
        `Error creating share link for memory ${memoryId}:`,
        err.message
      );
      res.status(500).json({ error: "Server error while creating share link" });
    }
  }
);

export default router;
