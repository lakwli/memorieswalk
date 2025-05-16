// Create file: server/middleware/upload.js

import multer from "multer";
import path from "path";
import { getUploadDir, generateUniqueFilename } from "../utils/fileUtils.js";

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const userId = req.user.id;
      const memoryId = req.params.id;
      const dir = getUploadDir(userId, memoryId);
      cb(null, dir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    try {
      const uniqueFilename = generateUniqueFilename(file.originalname);
      cb(null, uniqueFilename);
    } catch (error) {
      cb(error);
    }
  },
});

// File filter to only accept images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (JPEG, PNG, GIF, WEBP)"), false);
  }
};

// Configure multer middleware
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10, // Max 10 files per upload
  },
});

export default upload;
