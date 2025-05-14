import express from "express";
import pool from "../db.js"; // Assuming db.js exports the PostgreSQL pool
import { authenticateToken } from "../auth.js"; // Assuming auth.js exports authenticateToken middleware

const router = express.Router();

// POST /api/canvases - Create a new canvas
router.post("/", authenticateToken, async (req, res) => {
  const { title } = req.body;
  const userId = req.user.userId; // Extracted from JWT by authenticateToken

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    const newCanvas = await pool.query(
      "INSERT INTO canvases (user_id, title, canvas_data, thumbnail_url) VALUES ($1, $2, $3, $4) RETURNING *",
      [userId, title, null, null] // Initial canvas_data and thumbnail_url are null
    );
    res.status(201).json(newCanvas.rows[0]);
  } catch (err) {
    console.error("Error creating canvas:", err.message);
    res.status(500).json({ error: "Server error while creating canvas" });
  }
});

// GET /api/canvases - List canvases for the authenticated user
router.get("/", authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const userCanvases = await pool.query(
      "SELECT id, title, thumbnail_url, updated_at FROM canvases WHERE user_id = $1 ORDER BY updated_at DESC",
      [userId]
    );
    res.json(userCanvases.rows);
  } catch (err) {
    console.error("Error fetching canvases:", err.message);
    res.status(500).json({ error: "Server error while fetching canvases" });
  }
});

// Middleware to check canvas ownership
const checkCanvasOwnership = async (req, res, next) => {
  const canvasId = parseInt(req.params.id);
  const userId = req.user.userId;

  if (isNaN(canvasId)) {
    return res.status(400).json({ error: "Invalid canvas ID" });
  }

  try {
    const canvas = await pool.query(
      "SELECT user_id FROM canvases WHERE id = $1",
      [canvasId]
    );
    if (canvas.rows.length === 0) {
      return res.status(404).json({ error: "Canvas not found" });
    }
    if (canvas.rows[0].user_id !== userId) {
      return res
        .status(403)
        .json({ error: "Forbidden: You do not own this canvas" });
    }
    req.canvasId = canvasId; // Attach canvasId to request object for later use
    next();
  } catch (err) {
    console.error("Error checking canvas ownership:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/canvases/:id - Get a specific canvas
router.get(
  "/:id",
  authenticateToken,
  checkCanvasOwnership,
  async (req, res) => {
    try {
      const canvas = await pool.query("SELECT * FROM canvases WHERE id = $1", [
        req.canvasId,
      ]);
      // checkCanvasOwnership already confirmed it exists and user owns it
      res.json(canvas.rows[0]);
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
      return res
        .status(400)
        .json({
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
      updateFields.push(`canvas_data = $${queryIndex++}`);
      values.push(canvas_data);
    }
    if (thumbnail_url !== undefined) {
      updateFields.push(`thumbnail_url = $${queryIndex++}`);
      values.push(thumbnail_url);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.canvasId); // For the WHERE clause

    const updateQuery = `UPDATE canvases SET ${updateFields.join(
      ", "
    )} WHERE id = $${queryIndex} RETURNING *`;

    try {
      const updatedCanvas = await pool.query(updateQuery, values);
      res.json(updatedCanvas.rows[0]);
    } catch (err) {
      console.error("Error updating canvas:", err.message);
      if (err.message.includes("invalid input syntax for type json")) {
        return res
          .status(400)
          .json({ error: "Invalid JSON format for canvas_data" });
      }
      res.status(500).json({ error: "Server error while updating canvas" });
    }
  }
);

// DELETE /api/canvases/:id - Delete a canvas
router.delete(
  "/:id",
  authenticateToken,
  checkCanvasOwnership,
  async (req, res) => {
    try {
      await pool.query("DELETE FROM canvases WHERE id = $1", [req.canvasId]);
      res.status(204).send(); // No content
    } catch (err) {
      console.error("Error deleting canvas:", err.message);
      res.status(500).json({ error: "Server error while deleting canvas" });
    }
  }
);

export default router;
