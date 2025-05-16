// Create file: server/utils/fileUtils.js

import fs from "fs";
import path from "path";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure upload directory exists
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

// Get upload directory path
function getUploadDir(userId, memoryId) {
  const baseUploadDir =
    process.env.UPLOAD_DIR || path.join(__dirname, "../uploads");
  const userDir = path.join(baseUploadDir, `user_${userId}`);
  const memoryDir = path.join(userDir, `memory_${memoryId}`);

  return ensureDir(memoryDir);
}

// Generate unique filename
function generateUniqueFilename(originalName) {
  const ext = path.extname(originalName).toLowerCase();
  return `${uuidv4()}${ext}`;
}

// Process image (create optimized and thumbnail versions)
async function processImage(originalPath, options = {}) {
  const {
    targetDir, // New option: directory to save processed files
    baseName, // New option: base name for output files (e.g., photoId)
    width = 2000,
    height = 2000,
    quality = 85,
  } = options;

  // Ensure targetDir is provided
  if (!targetDir || !baseName) {
    throw new Error("targetDir and baseName are required for processImage");
  }

  // Ensure the target directory exists
  ensureDir(targetDir);

  // Define output paths using targetDir and baseName
  // We'll save as .webp for optimization
  const optimizedFileName = `${baseName}.webp`;
  const optimizedPath = path.join(targetDir, optimizedFileName);

  try {
    // Get image metadata
    const metadata = await sharp(originalPath).metadata();

    // Create optimized version (WebP)
    await sharp(originalPath)
      .resize(width, height, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality }) // Save as WebP
      .toFile(optimizedPath);

    // Delete the original temporary file after successful processing
    if (fs.existsSync(originalPath)) {
      fs.unlinkSync(originalPath);
    }

    return {
      processedPath: optimizedPath, // Return the path of the main processed image
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: "webp", // Output format is webp
        originalFormat: metadata.format,
        size: (await fs.promises.stat(optimizedPath)).size, // Get size of the new file
      },
    };
  } catch (error) {
    // Attempt to delete any partially created files if processing fails
    if (fs.existsSync(optimizedPath)) fs.unlinkSync(optimizedPath);
    console.error("Error in processImage:", error);
    throw error;
  }
}

// Renamed from cleanupOnError and modified to handle single or multiple files
async function deleteFiles(files) {
  if (!Array.isArray(files)) files = [files];

  for (const file of files) {
    if (file && typeof file === 'string') { // Ensure it's a string path
      try {
        if (fs.existsSync(file)) { // Check if file exists before attempting to delete
          await fs.promises.unlink(file);
        }
      } catch (err) {
        console.error(`Error deleting file ${file}:`, err.message);
      }
    }
  }
}

// New function to delete a single file
async function deleteFile(filePath) {
  if (filePath && typeof filePath === 'string') {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true; // Indicate success
      } else {
        return false; // Indicate file not found
      }
    } catch (err) {
      console.error(`Error deleting file ${filePath}:`, err.message);
      throw err; // Re-throw for the caller to handle
    }
  }
  return false; // Indicate invalid path or no action taken
}

export {
  ensureDir,
  getUploadDir,
  generateUniqueFilename,
  processImage,
  deleteFiles, // Export renamed function
  deleteFile,  // Export new function
};
