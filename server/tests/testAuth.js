import dotenv from "dotenv";
import pool from "../db.js";
import bcrypt from "bcrypt";

dotenv.config();

async function testAuth() {
  try {
    console.log("🔍 Testing admin authentication...");

    const result = await pool.query(
      "SELECT id, username, password_hash FROM users WHERE username = $1",
      ["admin"]
    );

    if (result.rows.length === 0) {
      console.log("❌ Admin user not found");
      return;
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare("admin", user.password_hash);

    console.log("Auth test result:", {
      userExists: true,
      passwordValid: validPassword,
    });
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await pool.end();
  }
}

testAuth();
