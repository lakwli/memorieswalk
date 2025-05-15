import pool from "../db.js";

async function migrateCanvasToMemory() {
  const client = await pool.connect();

  try {
    // Start a transaction
    await client.query("BEGIN");

    console.log("Starting migration of data from canvases to memories table");

    // Check if memories table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'memories'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log("Memories table doesn't exist. Creating it...");
      await client.query(`
        CREATE TABLE memories (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          title VARCHAR(255) NOT NULL,
          memory_data JSONB,
          thumbnail_url VARCHAR(255),
          view_type VARCHAR(50) DEFAULT 'canvas',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }

    // Check if photos table exists
    const photosTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'photos'
      );
    `);

    if (!photosTableCheck.rows[0].exists) {
      console.log("Photos table doesn't exist. Creating it...");
      await client.query(`
        CREATE TABLE photos (
          id SERIAL PRIMARY KEY,
          memory_id INTEGER REFERENCES memories(id) ON DELETE CASCADE,
          file_path VARCHAR(255) NOT NULL,
          location_lat DECIMAL(10, 8),
          location_lng DECIMAL(11, 8),
          captured_place VARCHAR(255),
          captured_at TIMESTAMP,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }

    // Check if canvases table exists and has data
    const canvasesTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'canvases'
      );
    `);

    if (canvasesTableCheck.rows[0].exists) {
      // Count canvases
      const canvasCount = await client.query("SELECT COUNT(*) FROM canvases");
      console.log(`Found ${canvasCount.rows[0].count} canvases to migrate`);

      if (parseInt(canvasCount.rows[0].count) > 0) {
        // Fetch all canvases
        const canvases = await client.query(`
          SELECT * FROM canvases
        `);

        console.log(
          `Migrating ${canvases.rows.length} canvases to memories...`
        );

        // Migrate each canvas to memories
        for (const canvas of canvases.rows) {
          const result = await client.query(
            `
            INSERT INTO memories 
            (user_id, title, memory_data, thumbnail_url, view_type, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
          `,
            [
              canvas.user_id,
              canvas.title,
              canvas.canvas_data,
              canvas.thumbnail_url,
              "canvas",
              canvas.created_at,
              canvas.updated_at,
            ]
          );

          const memoryId = result.rows[0].id;
          console.log(
            `Migrated canvas ID ${canvas.id} to memory ID ${memoryId}`
          );

          // Check for share links associated with this canvas
          const shareLinks = await client.query(
            `
            SELECT * FROM share_links WHERE canvas_id = $1
          `,
            [canvas.id]
          );

          if (shareLinks.rows.length > 0) {
            console.log(
              `Migrating ${shareLinks.rows.length} share links for canvas ID ${canvas.id}`
            );

            // Update share links to point to the new memory
            for (const link of shareLinks.rows) {
              await client.query(
                `
                UPDATE share_links 
                SET memory_id = $1, 
                    canvas_id = NULL
                WHERE id = $2
              `,
                [memoryId, link.id]
              );
            }
          }
        }

        console.log("Migration completed successfully");
      } else {
        console.log("No canvases to migrate");
      }
    } else {
      console.log("Canvases table doesn't exist. No data to migrate.");
    }

    // Commit the transaction
    await client.query("COMMIT");
    console.log("Database changes committed successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error during migration:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Execute the migration
migrateCanvasToMemory()
  .then(() => {
    console.log("Migration process completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
