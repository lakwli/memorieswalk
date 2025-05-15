// This file provides backward compatibility for the old Canvas API
// It redirects requests to the new Memory API while transforming data as needed
import express from "express";
import pool from "../db.js"; // PostgreSQL pool
import { authenticateToken } from "../auth.js"; // Authentication middleware

const router = express.Router();

// Helper function to map memory to canvas format
function mapMemoryToCanvas(memory) {
  return {
    ...memory,
    canvas_data: memory.memory_data,
  };
}

// POST /api/canvases - Create a new canvas (now a memory)
router.post("/", authenticateToken, async (req, res) => {
  const { title } = req.body;
  const userId = req.user.userId; // Extracted from JWT by authenticateToken

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    const newMemory = await pool.query(
      "INSERT INTO memories (user_id, title, memory_data, thumbnail_url, view_type) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [userId, title, null, null, "canvas"] // Initial memory_data and thumbnail_url are null
    );
    // Map to the old canvas format for backward compatibility
    res.status(201).json(mapMemoryToCanvas(newMemory.rows[0]));
  } catch (err) {
    console.error("Error creating canvas (now memory):", err.message);
    res.status(500).json({ error: "Server error while creating canvas" });
  }
});

// GET /api/canvases - List canvases for the authenticated user
router.get("/", authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const userMemories = await pool.query(
      "SELECT id, user_id, title, memory_data, thumbnail_url, created_at, updated_at FROM memories WHERE user_id = $1 ORDER BY updated_at DESC",
      [userId]
    );

    // Map memories to canvases for backward compatibility
    const canvases = userMemories.rows.map(mapMemoryToCanvas);
    res.json(canvases);
  } catch (err) {
    console.error("Error fetching canvases (now memories):", err.message);
    res.status(500).json({ error: "Server error while fetching canvases" });
  }
});

// Middleware to check memory ownership (but named for backward compatibility)
const checkCanvasOwnership = async (req, res, next) => {
  const memoryId = parseInt(req.params.id);
  const userId = req.user.userId;

  if (isNaN(memoryId)) {
    return res.status(400).json({ error: "Invalid canvas ID" });
  }

  try {
    const memory = await pool.query(
      "SELECT user_id FROM memories WHERE id = $1",
      [memoryId]
    );
    if (memory.rows.length === 0) {
      return res.status(404).json({ error: "Canvas not found" });
    }
    if (memory.rows[0].user_id !== userId) {
      return res
        .status(403)
        .json({ error: "Forbidden: You do not own this canvas" });
    }
    req.memoryId = memoryId; // Attach memoryId to request object for later use
    next();
  } catch (err) {
    console.error("Error checking canvas ownership:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/canvases/:id - Get a specific canvas (now memory)
router.get(
  "/:id",
  authenticateToken,
  checkCanvasOwnership,
  async (req, res) => {
    try {
      const memory = await pool.query("SELECT * FROM memories WHERE id = $1", [
        req.memoryId,
      ]);
      // checkCanvasOwnership already confirmed it exists and user owns it
      // Map to canvas format for backward compatibility
      res.json(mapMemoryToCanvas(memory.rows[0]));
    } catch (err) {
      console.error("Error fetching canvas by ID:", err.message);
      res.status(500).json({ error: "Server error while fetching canvas" });
    }
  }
);

// PUT /api/canvases/:id - Update a canvas
router.put(
  "/:id",
  authenticateToken,
  checkCanvasOwnership,
  async (req, res) => {
    const { title, canvas_data, thumbnail_url } = req.body;

    // Basic validation: at least one field to update should be present
    if (
      title === undefined &&
      canvas_data === undefined &&
      thumbnail_url === undefined
    ) {
      return res.status(400).json({
        error:
          "No update fields provided (title, canvas_data, or thumbnail_url)",
      });
    }

    const updateFields = [];
    const values = [];
    let queryIndex = 1;

    if (title !== undefined) {
      updateFields.push(`title = $${queryIndex++}`);
      values.push(title);
    }
    if (canvas_data !== undefined) {
      updateFields.push(`memory_data = $${queryIndex++}`); // Note: changed to memory_data
      values.push(canvas_data);
    }
    if (thumbnail_url !== undefined) {
      updateFields.push(`thumbnail_url = $${queryIndex++}`);
      values.push(thumbnail_url);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.memoryId); // For the WHERE clause - using memoryId instead of canvasId

    const updateQuery = `UPDATE memories SET ${updateFields.join(
      ", "
    )} WHERE id = $${queryIndex} RETURNING *`;

    try {
      const updatedMemory = await pool.query(updateQuery, values);
      // Map to canvas format for backward compatibility
      res.json(mapMemoryToCanvas(updatedMemory.rows[0]));
    } catch (err) {
      console.error("Error updating memory:", err.message);
      if (err.message.includes("invalid input syntax for type json")) {
        return res
          .status(400)
          .json({ error: "Invalid JSON format for memory_data" });
      }
      res.status(500).json({ error: "Server error while updating canvas" });
    }
  }
);

// DELETE /api/canvases/:id - Delete a canvas (now memory)
router.delete(
  "/:id",
  authenticateToken,
  checkCanvasOwnership,
  async (req, res) => {
    try {
      await pool.query("DELETE FROM memories WHERE id = $1", [req.memoryId]);
      res.status(204).send(); // No content
    } catch (err) {
      console.error("Error deleting memory:", err.message);
      res.status(500).json({ error: "Server error while deleting canvas" });
    }
  }
);

export default router;
