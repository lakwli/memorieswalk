import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("Starting Canvas to Memory migration...");

try {
  // Execute the migration script
  execSync("node migrateCanvasToMemory.js", {
    cwd: __dirname,
    stdio: "inherit",
  });

  console.log("Migration completed successfully!");
  process.exit(0);
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exit(1);
}
