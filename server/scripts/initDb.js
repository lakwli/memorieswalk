import dotenv from "dotenv";
import pool from "../db.js";
import bcrypt from "bcrypt";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function initializeDb() {
  try {
    console.log("🔄 Initializing database...");

    // Drop existing tables
    console.log("Dropping existing tables if any...");
    await pool.query(`
      DROP TABLE IF EXISTS share_links CASCADE;
      DROP TABLE IF EXISTS photos CASCADE;
      DROP TABLE IF EXISTS memories CASCADE;
      DROP TABLE IF EXISTS canvases CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    console.log("✅ Existing tables dropped");

    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, "../../database/schema.sql");
    const schema = await fs.readFile(schemaPath, "utf8");
    await pool.query(schema);
    console.log("✅ Schema created");

    // Check for admin user
    const adminCheck = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      ["admin"]
    );

    if (adminCheck.rows.length === 0) {
      const hashedPassword = await bcrypt.hash("admin", 10);
      await pool.query(
        "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)",
        ["admin", hashedPassword, "admin"]
      );
      console.log("✅ Admin user created");
    }

    console.log("✅ Database initialization complete");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initializeDb();
