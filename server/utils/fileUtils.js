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
    targetDir,
    baseName,
    width = 2000,
    height = 2000,
    quality = 85,
  } = options;

  console.log(`[processImage] Received originalPath: ${originalPath}`);
  console.log(
    `[processImage] Options: ${{ targetDir, baseName, width, height, quality }}`
  );

  if (!targetDir || !baseName) {
    console.error("[processImage] Error: targetDir and baseName are required.");
    throw new Error("targetDir and baseName are required for processImage");
  }

  ensureDir(targetDir);

  const optimizedFileName = `${baseName}.webp`;
  const optimizedPath = path.join(targetDir, optimizedFileName);
  console.log(`[processImage] Optimized path will be: ${optimizedPath}`);

  try {
    console.log(
      `[processImage] Attempting to get metadata for: ${originalPath}`
    );
    let fileMetadata;
    try {
      fileMetadata = await sharp(originalPath).metadata();
      console.log(
        "[processImage] Successfully retrieved metadata:",
        fileMetadata
      );
    } catch (metadataError) {
      console.error(
        `[processImage] Error retrieving metadata for ${originalPath}:`,
        metadataError
      );
      throw metadataError; // Re-throw to be caught by the outer try-catch
    }

    console.log(
      `[processImage] Attempting to resize and convert to WebP: ${originalPath}`
    );
    await sharp(originalPath)
      .resize(width, height, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toFile(optimizedPath);
    console.log(
      `[processImage] Successfully processed and saved to: ${optimizedPath}`
    );

    if (fs.existsSync(originalPath)) {
      console.log(
        `[processImage] Deleting original temporary file: ${originalPath}`
      );
      fs.unlinkSync(originalPath);
    }

    const newFileSize = (await fs.promises.stat(optimizedPath)).size;
    console.log(`[processImage] New file size: ${newFileSize} bytes`);

    return {
      processedPath: optimizedPath,
      metadata: {
        width: fileMetadata.width, // Use metadata from the successful call
        height: fileMetadata.height,
        format: "webp",
        originalFormat: fileMetadata.format,
        size: newFileSize,
      },
    };
  } catch (error) {
    console.error(
      `[processImage] Error during image processing for ${originalPath}:`,
      error
    );
    if (fs.existsSync(optimizedPath)) {
      console.log(
        `[processImage] Cleaning up partially created file: ${optimizedPath}`
      );
      fs.unlinkSync(optimizedPath);
    }
    throw error;
  }
}

// Renamed from cleanupOnError and modified to handle single or multiple files
async function deleteFiles(files) {
  if (!Array.isArray(files)) files = [files];

  for (const file of files) {
    if (file && typeof file === "string") {
      // Ensure it's a string path
      try {
        if (fs.existsSync(file)) {
          // Check if file exists before attempting to delete
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
  if (filePath && typeof filePath === "string") {
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
  deleteFile, // Export new function
};
