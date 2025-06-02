import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import photoService from "../services/photoService.js";
import { pool } from "../db.js";
import { ELEMENT_STATES } from "../constants/index.js";

const router = express.Router();

/**
 * Check if user has access to the photo
 * @param {string} photoId - Photo ID to check
 * @param {string} userId - User ID to verify against
 * @param {string} state - Photo state (ELEMENT_STATES.NEW for temporary, ELEMENT_STATES.PERSISTED for permanent)
 * @returns {Promise<boolean>} True if user has access, false otherwise
 */
async function checkPhotoAccess(photoId, userId, state) {
  if (state === ELEMENT_STATES.NEW) {
    // For temporary photos (NEW state), check session ownership
    // This will be handled by the frontend session state
    return true;
  } else {
    // For permanent photos, check if user has access through any memory
    const result = await pool.query(
      `SELECT EXISTS (
                SELECT 1 FROM photos p
                JOIN memory_photos mp ON p.id = mp.photo_id
                JOIN memories m ON mp.memory_id = m.id
                WHERE p.id = $1 AND m.user_id = $2
            )`,
      [photoId, userId]
    );
    return result.rows[0].exists;
  }
}

/**
 * Upload new photo(s)
 * POST /api/photos/upload
 */
router.post(
  "/upload",
  authenticateToken,
  upload.array("photos", 10),
  async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded." });
    }

    try {
      const uploadPromises = req.files.map(async (file) => {
        const result = await photoService.saveToTemp(file);
        return {
          id: result.id,
          state: ELEMENT_STATES.NEW, // NEW photo state (temporary storage)
        };
      });

      const photos = await Promise.all(uploadPromises);
      res.status(201).json(photos);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Retrieve photo by ID and state
 * GET /api/photos/retrieve/:id?state=N|P
 */
router.get("/retrieve/:id", authenticateToken, async (req, res, next) => {
  const { id } = req.params;
  const { state } = req.query;

  if (
    !state ||
    ![ELEMENT_STATES.NEW, ELEMENT_STATES.PERSISTED].includes(state)
  ) {
    return res.status(400).json({
      error: "Invalid state parameter. Must be N (NEW) or P (PERSISTED).",
    });
  }

  try {
    // Check access permission
    const hasAccess = await checkPhotoAccess(id, req.user.userId, state);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied to this photo." });
    }

    // Get photo file
    const photo = await photoService.retrievePhoto(id, state);

    res.setHeader("Content-Type", photo.mimeType);
    res.sendFile(photo.path);
  } catch (error) {
    if (error.message === "Photo file not found") {
      res.status(404).json({ error: "Photo not found." });
    } else {
      next(error);
    }
  }
});

/**
 * Clean up a temporary photo
 * DELETE /api/photos/temp/:id
 */
router.delete("/temp/:id", authenticateToken, async (req, res, next) => {
  const { id } = req.params;

  try {
    await photoService.removeTemporary(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
