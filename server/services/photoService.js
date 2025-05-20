import fs from "fs-extra";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { processImage } from "../utils/fileUtils.js";
import { FILE_STORAGE_CONFIG } from "../config.js";

const { TEMP_PHOTOS_DIR, PERMANENT_PHOTOS_DIR } = FILE_STORAGE_CONFIG;

// Ensure directories exist
fs.ensureDirSync(TEMP_PHOTOS_DIR);
fs.ensureDirSync(PERMANENT_PHOTOS_DIR);

/**
 * Handles photo upload to temporary storage
 * @param {Object} file - The uploaded file
 * @returns {Promise<{id: string, path: string}>}
 */
async function saveToTemp(file) {
  const photoId = uuidv4();
  const firstPartOfUuid = photoId.split("-")[0];
  const tempDir = path.join(TEMP_PHOTOS_DIR, firstPartOfUuid);

  // Process and save image
  await processImage({
    inputPath: file.path,
    targetDir: tempDir,
    baseName: photoId,
  });

  return {
    id: photoId,
    path: path.join(firstPartOfUuid, `${photoId}.webp`),
  };
}

/**
 * Retrieves a photo file based on its state
 * @param {string} photoId - The photo ID
 * @param {string} state - The photo state (N or P)
 * @returns {Promise<{path: string, mimeType: string}>}
 */
async function retrievePhoto(photoId, state) {
  const firstPartOfUuid = photoId.split("-")[0];
  const fileName = `${photoId}.webp`;

  const baseDir = state === "N" ? TEMP_PHOTOS_DIR : PERMANENT_PHOTOS_DIR;
  const filePath = path.join(baseDir, firstPartOfUuid, fileName);

  if (!(await fs.pathExists(filePath))) {
    throw new Error("Photo file not found");
  }

  return {
    path: filePath,
    mimeType: "image/webp",
  };
}

/**
 * Handles photo move from temporary storage to permanent storage
 * @param {string} photoId - The photo ID
 * @returns {Promise<void>}
 */
async function makePermanent(photoId) {
  const firstPartOfUuid = photoId.split("-")[0];
  const fileName = `${photoId}.webp`;

  const tempDir = path.join(TEMP_PHOTOS_DIR, firstPartOfUuid);
  const tempFilePath = path.join(tempDir, fileName);

  const permanentDir = path.join(PERMANENT_PHOTOS_DIR, firstPartOfUuid);
  const permanentFilePath = path.join(permanentDir, fileName);

  // Check if file exists in temp directory
  if (!(await fs.pathExists(tempFilePath))) {
    throw new Error(
      `Photo file not found in temporary directory: ${tempFilePath}`
    );
  }

  // Ensure permanent directory exists
  await fs.ensureDir(permanentDir);

  // Move file
  await fs.move(tempFilePath, permanentFilePath, { overwrite: true });
}

/**
 * Remove a photo from temporary storage
 * @param {string} photoId - The photo ID to remove
 * @returns {Promise<void>}
 */
async function removeTemporary(photoId) {
  const firstPartOfUuid = photoId.split("-")[0];
  const fileName = `${photoId}.webp`;
  const tempDir = path.join(TEMP_PHOTOS_DIR, firstPartOfUuid);
  const tempFilePath = path.join(tempDir, fileName);

  console.log(`Attempting to remove temporary photo: ${tempFilePath}`);

  try {
    if (await fs.pathExists(tempFilePath)) {
      await fs.unlink(tempFilePath);
      console.log(`Successfully removed temporary photo: ${tempFilePath}`);

      // Try to remove the directory if it's empty
      const dirFiles = await fs.readdir(tempDir);
      if (dirFiles.length === 0) {
        await fs.rmdir(tempDir);
        console.log(`Removed empty directory: ${tempDir}`);
      }
    } else {
      console.log(`Temporary photo not found: ${tempFilePath}`);
    }
  } catch (error) {
    console.error(`Error removing temporary photo ${photoId}:`, error);
    // Don't throw - we want to continue even if file removal fails
  }
}

/**
 * Removes a photo file from permanent storage
 * @param {string} photoId - The photo ID
 */
async function removePermanent(photoId) {
  const firstPartOfUuid = photoId.split("-")[0];
  const fileName = `${photoId}.webp`;
  const filePath = path.join(PERMANENT_PHOTOS_DIR, firstPartOfUuid, fileName);

  if (await fs.pathExists(filePath)) {
    await fs.remove(filePath);

    // Try to remove empty directory
    const dirPath = path.join(PERMANENT_PHOTOS_DIR, firstPartOfUuid);
    try {
      await fs.rmdir(dirPath);
    } catch (error) {
      // Ignore errors removing directory
      console.warn(`Failed to remove empty directory: ${dirPath}`, error);
    }
  }
}

/**
 * Removes a photo from temporary storage
 * @param {string} photoId - The photo ID
 */
async function removeTemp(photoId) {
  const firstPartOfUuid = photoId.split("-")[0];
  const fileName = `${photoId}.webp`;
  const filePath = path.join(TEMP_PHOTOS_DIR, firstPartOfUuid, fileName);

  if (await fs.pathExists(filePath)) {
    await fs.remove(filePath);

    // Try to remove empty directory
    const dirPath = path.join(TEMP_PHOTOS_DIR, firstPartOfUuid);
    try {
      await fs.rmdir(dirPath);
    } catch (error) {
      // Ignore errors removing directory
      console.warn(`Failed to remove empty directory: ${dirPath}`, error);
    }
  }
}

export default {
  saveToTemp,
  retrievePhoto,
  makePermanent,
  removePermanent,
  removeTemp,
  removeTemporary,
};
