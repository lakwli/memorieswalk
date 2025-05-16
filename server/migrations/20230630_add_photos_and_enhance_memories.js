// Create file: server/migrations/20230630_add_photos_and_enhance_memories.js

import pg from "pg";
const { Pool } = pg;
import dotenv from "dotenv";
dotenv.config();
import { argv, exit, env } from 'node:process';

const pool = new Pool(
  env.DATABASE_URL
    ? { connectionString: env.DATABASE_URL }
    : {
        user: env.DB_USER,
        host: env.DB_HOST,
        database: env.DB_NAME,
        password: env.DB_PASSWORD,
        port: parseInt(env.DB_PORT || "5432", 10),
      }
);

async function runMigration() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Check if photos table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'photos'
      );
    `);

    // Only create if it doesn't exist
    if (!tableCheck.rows[0].exists) {
      console.log("Creating photos table...");

      // Create photos table
      await client.query(`
        CREATE TABLE photos (
          id SERIAL PRIMARY KEY,
          memory_id INTEGER NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          original_url TEXT NOT NULL,
          optimized_url TEXT NOT NULL,
          thumbnail_url TEXT NOT NULL,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX idx_photos_memory_id ON photos(memory_id);
        CREATE INDEX idx_photos_user_id ON photos(user_id);
      `);
    } else {
      console.log("Photos table already exists, skipping creation.");
    }

    // Add any new columns to memories table if needed
    // For example, if we want to add a background_color column:
    // await client.query(`
    //   ALTER TABLE memories ADD COLUMN IF NOT EXISTS background_color VARCHAR(20) DEFAULT '#FFFFFF';
    // `);

    await client.query("COMMIT");
    console.log("Migration completed successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Only run directly if this is the main module
// ESM doesn't have a direct equivalent of require.main === module
// This check is often used to determine if a script is run directly or imported.
// For a simple migration script like this, you might run it directly via node.
// If you need to export runMigration for other modules, that's fine too.
// For now, let's assume it will be run directly.
if (import.meta.url === `file://${argv[1]}`) {
  runMigration()
    .then(() => exit(0))
    .catch(() => exit(1));
}

export { runMigration };
