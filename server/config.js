import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const FILE_STORAGE_CONFIG = {
  TEMP_PHOTOS_DIR: path.join(__dirname, "file_storage/temp_photos"),
  PERMANENT_PHOTOS_DIR: path.join(__dirname, "file_storage/photos"),

  // Temp file cleanup configuration
  CLEANUP: {
    // Enable cleanup in production by default, or when explicitly enabled via env variable
    ENABLED:
      process.env.ENABLE_TEMP_CLEANUP === "false" ||
      process.env.NODE_ENV === "production",
    // Default cleanup interval: 24 hours (in milliseconds)
    INTERVAL_MS: parseInt(process.env.CLEANUP_INTERVAL_MS || "86400000"),
    // Default max age for temp files: 1 hour (in milliseconds)
    MAX_AGE_MS: parseInt(process.env.CLEANUP_MAX_AGE_MS || "3600000"),
  },
};

export default FILE_STORAGE_CONFIG;
