import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const FILE_STORAGE_CONFIG = {
  TEMP_PHOTOS_DIR: path.join(__dirname, "file_storage/temp_photos"),
  PERMANENT_PHOTOS_DIR: path.join(__dirname, "file_storage/photos"),
};

export default FILE_STORAGE_CONFIG;
