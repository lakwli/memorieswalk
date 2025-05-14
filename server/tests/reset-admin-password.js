import dotenv from "dotenv";
import pool from "../db.js";
import bcrypt from "bcrypt";

dotenv.config();

async function resetAdminPassword() {
  const newPassword = "admin";
  const saltRounds = 10;
  const hash = await bcrypt.hash(newPassword, 10);

  console.log("New password:", newPassword);
  console.log("Generated hash:", hash);

  await pool.query("UPDATE users SET password_hash = $1 WHERE username = $2", [
    hash,
    "admin",
  ]);

  // Verify the update
  const result = await pool.query(
    "SELECT username, password_hash FROM users WHERE username = $1",
    ["admin"]
  );

  console.log("Stored hash in database:", result.rows[0].password_hash);
  console.log("Password reset complete");

  await pool.end();
}

resetAdminPassword().catch(console.error);
