import pool from "../db.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function initializeDb() {
  try {
    console.log("🔄 Initializing database...");

    // The schema.sql now handles dropping tables and creating the admin user.
    // We only need to execute the schema.sql file.

    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, "../../database/schema.sql");
    const schema = await fs.readFile(schemaPath, "utf8");
    await pool.query(schema);
    console.log(
      "✅ Schema executed (tables dropped, created, and admin user ensured)"
    );

    console.log("✅ Database initialization complete");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    if (typeof process !== "undefined" && process.exit) {
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

initializeDb();
