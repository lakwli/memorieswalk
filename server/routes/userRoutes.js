import express from "express";
import bcrypt from "bcrypt"; // Changed from bcryptjs
import db from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get user profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT id, username, full_name, email, role FROM users WHERE id = $1",
      [req.user.userId] // Corrected from req.user.id
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Error fetching user profile" });
  }
});

// Update user profile
router.put("/profile", authenticateToken, async (req, res) => {
  const { fullName, email } = req.body;
  const userId = req.user.userId; // Corrected from req.user.id

  if (!fullName && !email) {
    return res
      .status(400)
      .json({ message: "No information provided to update." });
  }

  try {
    // Check if email is already in use by another user
    if (email) {
      const emailCheck = await db.query(
        "SELECT id FROM users WHERE email = $1 AND id != $2",
        [email, userId]
      );
      if (emailCheck.rows.length > 0) {
        return res
          .status(400)
          .json({ message: "Email already in use by another account." });
      }
    }

    const fields = [];
    const values = [];
    let queryIndex = 1;

    if (fullName) {
      fields.push(`full_name = $${queryIndex++}`);
      values.push(fullName);
    }
    if (email) {
      fields.push(`email = $${queryIndex++}`);
      values.push(email);
    }

    values.push(userId);

    const query = `UPDATE users SET ${fields.join(
      ", "
    )}, updated_at = CURRENT_TIMESTAMP WHERE id = $${queryIndex} RETURNING id, username, full_name, email, role`;

    const { rows } = await db.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Error updating user profile" });
  }
});

// Change password
router.put("/password", authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.userId; // Corrected from req.user.id

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Current password and new password are required." });
  }

  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ message: "New password must be at least 6 characters long." });
  }

  try {
    const { rows } = await db.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password." });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await db.query(
      "UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [newPasswordHash, userId]
    );

    res.json({ message: "Password changed successfully." });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Error changing password" });
  }
});

export default router;
