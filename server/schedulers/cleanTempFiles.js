import fs from "fs";
import path from "path";
import { FILE_STORAGE_CONFIG } from "../config.js";

/**
 * Cleans up temporary files that are older than the specified max age
 * @returns {Promise<{deleted: number, errors: number}>} Statistics about the cleanup operation
 */
export async function cleanupTempFiles() {
  const tempDir = FILE_STORAGE_CONFIG.TEMP_PHOTOS_DIR;
  const maxAgeMs = FILE_STORAGE_CONFIG.CLEANUP.MAX_AGE_MS;
  const now = Date.now();
  let deleted = 0;
  let errors = 0;

  try {
    // Ensure the directory exists
    if (!fs.existsSync(tempDir)) {
      console.log(
        `Temp directory ${tempDir} does not exist. Nothing to clean up.`
      );
      return { deleted, errors };
    }

    // Read all files in the temp directory
    const files = fs.readdirSync(tempDir);
    console.log(`Found ${files.length} files in temp directory`);

    for (const file of files) {
      try {
        const filePath = path.join(tempDir, file);
        const stats = fs.statSync(filePath);

        // Skip directories
        if (stats.isDirectory()) {
          continue;
        }

        // Check file age
        const fileAge = now - stats.mtimeMs;

        if (fileAge > maxAgeMs) {
          console.log(
            `Deleting old temp file: ${file} (${
              fileAge / 1000 / 60
            } minutes old)`
          );
          fs.unlinkSync(filePath);
          deleted++;
        }
      } catch (err) {
        console.error(`Error processing file ${file}:`, err);
        errors++;
      }
    }

    console.log(
      `Temp file cleanup completed: ${deleted} files deleted, ${errors} errors`
    );
    return { deleted, errors };
  } catch (err) {
    console.error("Error during temp file cleanup:", err);
    throw err;
  }
}

export default cleanupTempFiles;
