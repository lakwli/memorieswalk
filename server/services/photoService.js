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
 * Makes a photo permanent by moving it from temp to permanent storage
 * @param {string} photoId - The photo ID
 */
async function makePermanent(photoId) {
  const firstPartOfUuid = photoId.split("-")[0];
  const fileName = `${photoId}.webp`;

  const tempPath = path.join(TEMP_PHOTOS_DIR, firstPartOfUuid, fileName);
  const permanentPath = path.join(
    PERMANENT_PHOTOS_DIR,
    firstPartOfUuid,
    fileName
  );

  // Ensure source exists and destination directory exists
  if (!(await fs.pathExists(tempPath))) {
    throw new Error("Temporary photo not found");
  }

  await fs.ensureDir(path.join(PERMANENT_PHOTOS_DIR, firstPartOfUuid));
  await fs.move(tempPath, permanentPath, { overwrite: true });

  // Explicitly remove the temporary file after moving
  try {
    await fs.remove(tempPath);
  } catch (error) {
    console.error(`Failed to remove temporary file: ${tempPath}`, error);
  }

  // Clean up empty temp directory if it exists
  const tempDir = path.join(TEMP_PHOTOS_DIR, firstPartOfUuid);
  try {
    await fs.rmdir(tempDir);
  } catch (error) {
    console.warn(`Failed to remove temp directory: ${tempDir}`, error);
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
};
