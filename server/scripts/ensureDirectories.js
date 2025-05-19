import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define storage directories
const baseDir = path.join(__dirname, "..", "file_storage");
const tempDir = path.join(baseDir, "temp_photos");
const permanentDir = path.join(baseDir, "photos");

// Ensure directories exist
fs.ensureDirSync(baseDir);
fs.ensureDirSync(tempDir);
fs.ensureDirSync(permanentDir);

console.log("Storage directories created:");
console.log("- Temp photos:", tempDir);
console.log("- Permanent photos:", permanentDir);
