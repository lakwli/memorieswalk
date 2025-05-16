# MyMemories Implementation Plan - Phase 3: Advanced Editing & Layer Management

## 1. Overview & Current Status

Building on the existing foundation from Phases 1-2, Phase 3 focuses on enhancing the editor with advanced features, specifically rotation, scaling, layers management, enhanced text formatting, undo/redo functionality, and improved photo upload and serving capabilities.

### 1.1 Current Architecture Summary

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│  Frontend   │◄─►  │   Backend   │◄─►  │  Database   │
│  (React)    │     │  (Node.js)  │     │ (PostgreSQL)│
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

## 2. Phase 3 Implementation Goals

1. Enhanced object manipulation (rotation, scaling)
2. Layer management system
3. Advanced text formatting
4. Multiple brush types for drawing
5. Undo/redo system
6. Improved photo upload and serving capabilities

## 3. Backend Enhancements - Core Implementation

### 3.1 Backend Dependencies and Setup

First, ensure all required packages are installed for the enhanced photo processing and JSON handling:

```javascript
// Add to server/package.json
{
  "dependencies": {
    // ...existing dependencies...
    "sharp": "^0.32.1",       // Image processing
    "multer": "^1.4.5-lts.1", // File upload handling
    "serve-static": "^1.15.0", // Enhanced static file serving
    "uuid": "^9.0.0",         // Unique ID generation
    "joi": "^17.9.2"          // Request validation
  }
}
```

Then run:

```bash
cd server
npm install
```

### 3.2 Database Schema Updates

Create migration script for any new tables or fields needed:

```javascript
// Create file: server/migrations/20230630_add_photos_and_enhance_memories.js

const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Check if photos table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'photos'
      );
    `);

    // Only create if it doesn't exist
    if (!tableCheck.rows[0].exists) {
      console.log("Creating photos table...");

      // Create photos table
      await client.query(`
        CREATE TABLE photos (
          id SERIAL PRIMARY KEY,
          memory_id INTEGER NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          original_url TEXT NOT NULL,
          optimized_url TEXT NOT NULL,
          thumbnail_url TEXT NOT NULL,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX idx_photos_memory_id ON photos(memory_id);
        CREATE INDEX idx_photos_user_id ON photos(user_id);
      `);
    } else {
      console.log("Photos table already exists, skipping creation.");
    }

    // Add any new columns to memories table if needed
    // For example, if we want to add a background_color column:
    // await client.query(`
    //   ALTER TABLE memories ADD COLUMN IF NOT EXISTS background_color VARCHAR(20) DEFAULT '#FFFFFF';
    // `);

    await client.query("COMMIT");
    console.log("Migration completed successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Only run directly if this is the main module
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runMigration };
```

### 3.3 Photo Upload Middleware and Utils

Create utilities for file handling:

```javascript
// Create file: server/utils/fileUtils.js

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");

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
    width = 2000,
    height = 2000,
    quality = 85,
    thumbWidth = 300,
  } = options;

  const dir = path.dirname(originalPath);
  const filename = path.basename(originalPath);
  const optimizedPath = path.join(dir, `opt_${filename}`);
  const thumbnailPath = path.join(dir, `thumb_${filename}`);

  try {
    // Get image metadata
    const metadata = await sharp(originalPath).metadata();

    // Create optimized version
    await sharp(originalPath)
      .resize(width, height, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality })
      .toFile(optimizedPath);

    // Create thumbnail
    await sharp(originalPath)
      .resize(thumbWidth, null, { fit: "inside" })
      .jpeg({ quality: quality - 5 }) // Slightly lower quality for thumbnails
      .toFile(thumbnailPath);

    return {
      paths: {
        original: originalPath,
        optimized: optimizedPath,
        thumbnail: thumbnailPath,
      },
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size,
      },
    };
  } catch (error) {
    // Delete files if processing fails
    [originalPath, optimizedPath, thumbnailPath].forEach((file) => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
    throw error;
  }
}

// Clean up files on error
function cleanupOnError(files) {
  if (!Array.isArray(files)) files = [files];

  files.forEach((file) => {
    if (file && fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });
}

module.exports = {
  ensureDir,
  getUploadDir,
  generateUniqueFilename,
  processImage,
  cleanupOnError,
};
```

### 3.4 File Upload Configuration

Create the multer configuration for handling file uploads:

```javascript
// Create file: server/middleware/upload.js

const multer = require("multer");
const path = require("path");
const { getUploadDir, generateUniqueFilename } = require("../utils/fileUtils");

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

module.exports = upload;
```

### 3.5 Enhanced Photo Upload Endpoint

Create or update the photo upload endpoint:

```javascript
// Add to server/routes/memory.js

const express = require("express");
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../middleware/auth");
const upload = require("../middleware/upload");
const { processImage, cleanupOnError } = require("../utils/fileUtils");
const path = require("path");

// Enhanced photo upload endpoint
router.post(
  "/memories/:id/photos",
  authMiddleware,
  upload.single("photo"),
  async (req, res) => {
    try {
      // Step 1: Check memory ownership
      const { id } = req.params;
      const memory = await db.query(
        "SELECT * FROM memories WHERE id = $1 AND user_id = $2",
        [id, req.user.id]
      );

      if (memory.rows.length === 0) {
        if (req.file) {
          cleanupOnError(req.file.path);
        }
        return res
          .status(404)
          .json({ message: "Memory not found or access denied" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Step 2: Process the uploaded image
      const uploadedFilePath = req.file.path;
      const processed = await processImage(uploadedFilePath);

      // Step 3: Generate URLs for frontend
      const baseUrl =
        process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
      const userId = req.user.id;
      const memoryId = id;

      // Extract filenames for URL generation
      const originalFilename = path.basename(processed.paths.original);
      const optimizedFilename = path.basename(processed.paths.optimized);
      const thumbnailFilename = path.basename(processed.paths.thumbnail);

      // Create URLs
      const originalUrl = `${baseUrl}/uploads/user_${userId}/memory_${memoryId}/${originalFilename}`;
      const optimizedUrl = `${baseUrl}/uploads/user_${userId}/memory_${memoryId}/${optimizedFilename}`;
      const thumbnailUrl = `${baseUrl}/uploads/user_${userId}/memory_${memoryId}/${thumbnailFilename}`;

      // Step 4: Store in database
      const photo = await db.query(
        `INSERT INTO photos 
         (memory_id, user_id, original_url, optimized_url, thumbnail_url, metadata, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
         RETURNING *`,
        [
          memoryId,
          userId,
          originalUrl,
          optimizedUrl,
          thumbnailUrl,
          JSON.stringify(processed.metadata),
        ]
      );

      // Step 5: Return URLs and metadata to frontend
      return res.status(201).json({
        photo: photo.rows[0],
        urls: {
          original: originalUrl,
          optimized: optimizedUrl,
          thumbnail: thumbnailUrl,
        },
        dimensions: {
          width: processed.metadata.width,
          height: processed.metadata.height,
        },
      });
    } catch (error) {
      console.error("Error uploading photo:", error);
      if (req.file) {
        cleanupOnError(req.file.path);
      }
      return res.status(500).json({ message: "Server error processing image" });
    }
  }
);

// Get photos for a specific memory
router.get("/memories/:id/photos", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership or access permission
    const memory = await db.query(
      "SELECT * FROM memories WHERE id = $1 AND user_id = $2",
      [id, req.user.id]
    );

    if (memory.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Memory not found or access denied" });
    }

    // Get all photos for this memory
    const photos = await db.query(
      "SELECT * FROM photos WHERE memory_id = $1 ORDER BY created_at DESC",
      [id]
    );

    return res.json(photos.rows);
  } catch (error) {
    console.error("Error fetching photos:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Delete a photo
router.delete("/photos/:photoId", authMiddleware, async (req, res) => {
  try {
    const { photoId } = req.params;

    // Check ownership
    const photo = await db.query(
      "SELECT * FROM photos WHERE id = $1 AND user_id = $2",
      [photoId, req.user.id]
    );

    if (photo.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Photo not found or access denied" });
    }

    // Delete from database
    await db.query("DELETE FROM photos WHERE id = $1", [photoId]);

    // Note: Physical file deletion could be handled here or via a cleanup job
    // For now, we'll keep the files to avoid broken links in case of accidental deletion

    return res.status(200).json({ message: "Photo deleted successfully" });
  } catch (error) {
    console.error("Error deleting photo:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
```

### 3.6 Configure Static File Serving

Update the server's main file to properly serve static files:

```javascript
// Update server/index.js

// ...existing code...

const path = require("path");
const serveStatic = require("serve-static");

// Set cache control headers based on file type for better performance
const setCustomCacheControl = (res, path) => {
  // For optimized images - cache for 1 week (604800 seconds)
  if (path.match(/^.*\/opt_.*\.(jpg|jpeg|png|gif|webp)$/i)) {
    res.setHeader("Cache-Control", "public, max-age=604800, immutable");
  }
  // For thumbnails - cache for 1 day (86400 seconds)
  else if (path.match(/^.*\/thumb_.*\.(jpg|jpeg|png|gif|webp)$/i)) {
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
  }
  // For original images - cache for 2 weeks
  else if (path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    res.setHeader("Cache-Control", "public, max-age=1209600, immutable");
  }
  // For other static assets
  else {
    res.setHeader("Cache-Control", "public, max-age=86400");
  }
};

// Configure upload directory path
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, "uploads");

// Serve static files from uploads directory with custom cache settings
app.use(
  "/uploads",
  serveStatic(uploadDir, {
    setHeaders: setCustomCacheControl,
    fallthrough: false, // Return 404 for missing files instead of continuing
    index: false, // Disable directory listing
    dotfiles: "ignore", // Don't serve dotfiles
  })
);

// Error handler for static file serving
app.use("/uploads", (err, req, res, next) => {
  if (err.code === "ENOENT") {
    return res.status(404).json({ message: "File not found" });
  }
  next(err);
});

// ...existing code...
```

### 3.7 Enhanced Memory Update for Layer Management

Update the memory routes to better handle advanced canvas features:

```javascript
// Update server/routes/memory.js

// ...existing code...

// Enhanced memory update endpoint for layer management
router.put("/memories/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, canvasData, thumbnail } = req.body;

    // Input validation
    if (!canvasData) {
      return res.status(400).json({ message: "Canvas data is required" });
    }

    // Verify ownership
    const memory = await db.query(
      "SELECT * FROM memories WHERE id = $1 AND user_id = $2",
      [id, req.user.id]
    );

    if (memory.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Memory not found or access denied" });
    }

    // Store current version in history table (optional, for undo feature server-side support)
    if (process.env.ENABLE_SERVER_HISTORY === "true") {
      await db.query(
        `INSERT INTO memory_history (memory_id, user_id, canvas_data, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [id, req.user.id, memory.rows[0].canvas_data]
      );

      // Limit history size per memory
      await db.query(
        `DELETE FROM memory_history 
         WHERE id IN (
           SELECT id FROM memory_history 
           WHERE memory_id = $1 
           ORDER BY created_at DESC 
           OFFSET 30
         )`,
        [id]
      );
    }

    // Update memory with enhanced canvas data
    const updatedMemory = await db.query(
      `UPDATE memories 
       SET title = COALESCE($1, title), 
           canvas_data = $2, 
           thumbnail_url = COALESCE($3, thumbnail_url), 
           updated_at = NOW() 
       WHERE id = $4 AND user_id = $5 
       RETURNING *`,
      [title, canvasData, thumbnail, id, req.user.id]
    );

    return res.json(updatedMemory.rows[0]);
  } catch (error) {
    console.error("Error updating memory:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Partial update for optimized layer manipulation
router.patch("/memories/:id/partial", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { operation, data, objectId } = req.body;

    // Verify ownership
    const memory = await db.query(
      "SELECT * FROM memories WHERE id = $1 AND user_id = $2",
      [id, req.user.id]
    );

    if (memory.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Memory not found or access denied" });
    }

    let updatedMemory;
    const currentData = memory.rows[0].canvas_data || { objects: [] };

    switch (operation) {
      case "add_object":
        // Add object to canvas data
        if (!Array.isArray(currentData.objects)) {
          currentData.objects = [];
        }

        currentData.objects.push(data);

        updatedMemory = await db.query(
          "UPDATE memories SET canvas_data = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *",
          [currentData, id, req.user.id]
        );
        break;

      case "update_object":
        // Update specific object
        if (Array.isArray(currentData.objects)) {
          const index = currentData.objects.findIndex(
            (obj) => obj.id === objectId
          );

          if (index !== -1) {
            currentData.objects[index] = {
              ...currentData.objects[index],
              ...data,
            };

            updatedMemory = await db.query(
              "UPDATE memories SET canvas_data = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *",
              [currentData, id, req.user.id]
            );
          } else {
            return res
              .status(404)
              .json({ message: "Object not found in canvas" });
          }
        }
        break;

      case "remove_object":
        // Remove object from canvas
        if (Array.isArray(currentData.objects)) {
          const filteredObjects = currentData.objects.filter(
            (obj) => obj.id !== objectId
          );

          if (filteredObjects.length !== currentData.objects.length) {
            currentData.objects = filteredObjects;

            updatedMemory = await db.query(
              "UPDATE memories SET canvas_data = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *",
              [currentData, id, req.user.id]
            );
          } else {
            return res
              .status(404)
              .json({ message: "Object not found in canvas" });
          }
        }
        break;

      case "reorder_objects":
        // Reorder objects (for layer management)
        if (data && Array.isArray(data.objectIds)) {
          // Map of all objects by id for quick lookup
          const objectsMap = {};
          currentData.objects.forEach((obj) => {
            objectsMap[obj.id] = obj;
          });

          // Create new ordered array
          const newObjects = data.objectIds
            .map((id) => objectsMap[id])
            .filter(Boolean);

          // Check if all objects are accounted for
          if (newObjects.length === currentData.objects.length) {
            currentData.objects = newObjects;

            updatedMemory = await db.query(
              "UPDATE memories SET canvas_data = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *",
              [currentData, id, req.user.id]
            );
          } else {
            return res
              .status(400)
              .json({ message: "Invalid object IDs for reordering" });
          }
        }
        break;

      default:
        return res.status(400).json({ message: "Invalid operation" });
    }

    return res.json({
      memory: updatedMemory.rows[0],
      success: true,
    });
  } catch (error) {
    console.error("Error performing partial update:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// ...existing code...
```

### 3.8 Error Handling Middleware

Enhance error handling for the backend:

```javascript
// Create file: server/middleware/errorHandler.js

const errorHandler = (err, req, res, next) => {
  // Log error for server-side debugging
  console.error("Error:", err);

  // Handle multer errors specifically
  if (err.name === "MulterError") {
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        return res.status(413).json({
          message: "File too large. Maximum size is 10MB.",
        });
      case "LIMIT_FILE_COUNT":
        return res.status(413).json({
          message: "Too many files. Maximum is 10 files per upload.",
        });
      case "LIMIT_UNEXPECTED_FILE":
        return res.status(400).json({
          message: "Unexpected field. Please check your form submission.",
        });
      default:
        return res.status(400).json({
          message: "File upload error.",
        });
    }
  }

  // Handle validation errors from Joi
  if (err.isJoi) {
    return res.status(400).json({
      message: "Validation error",
      details: err.details,
    });
  }

  // Handle known error types
  switch (err.name) {
    case "SyntaxError":
      return res.status(400).json({
        message: "Invalid JSON in request",
      });
    case "JsonWebTokenError":
    case "TokenExpiredError":
      return res.status(401).json({
        message: "Authentication failed. Please log in again.",
      });
    default:
      // For all other errors, return generic message
      return res.status(500).json({
        message: "An unexpected error occurred",
      });
  }
};

module.exports = errorHandler;
```

Add the error handler middleware to your Express app:

```javascript
// Update server/index.js

// ...existing code...

// Import error handler
const errorHandler = require("./middleware/errorHandler");

// Define all routes
app.use("/api", authRoutes);
app.use("/api", memoryRoutes);
// ...other routes...

// Add error handling middleware - MUST be after all routes
app.use(errorHandler);

// ...existing code...
```

### 3.9 Performance Optimizations for Large Canvases

```javascript
// Create file: server/utils/canvasOptimizer.js

/**
 * Utility to optimize canvas data for storage and transmission
 */
const canvasOptimizer = {
  /**
   * Optimizes canvas data by removing unnecessary properties
   * @param {Object} canvasData - The full canvas data object
   * @return {Object} Optimized canvas data
   */
  optimize: (canvasData) => {
    if (!canvasData || typeof canvasData !== "object") {
      return canvasData;
    }

    // Create a deep copy to avoid modifying the original
    const optimized = JSON.parse(JSON.stringify(canvasData));

    // Process objects array if it exists
    if (Array.isArray(optimized.objects)) {
      optimized.objects = optimized.objects.map((obj) => {
        // Remove cached properties that can be recalculated
        delete obj._cacheCanvas;
        delete obj._cacheContext;
        delete obj.cacheWidth;
        delete obj.cacheHeight;

        // Remove redundant transforms that can be recalculated
        if (obj.type === "image" && obj.filters && obj.filters.length === 0) {
          delete obj.filters;
        }

        // Keep the minimal set of properties needed to reconstruct the object
        return obj;
      });
    }

    return optimized;
  },

  /**
   * Calculates the compressed size of canvas data
   * @param {Object} canvasData - Canvas data object
   * @return {Number} Size in bytes
   */
  getSize: (canvasData) => {
    try {
      const jsonString = JSON.stringify(canvasData);
      return Buffer.byteLength(jsonString, "utf8");
    } catch (error) {
      console.error("Error calculating canvas size:", error);
      return 0;
    }
  },
};

module.exports = canvasOptimizer;
```

Use the optimizer when saving canvases:

```javascript
// Update server/routes/memory.js

// Add to imports at the top
const canvasOptimizer = require("../utils/canvasOptimizer");

// Update PUT endpoint to use optimizer
router.put("/memories/:id", authMiddleware, async (req, res) => {
  try {
    // ...existing code...

    // Optimize canvas data before storing
    const optimizedCanvasData = canvasOptimizer.optimize(canvasData);

    // Check size limits
    const dataSize = canvasOptimizer.getSize(optimizedCanvasData);
    const maxSize = 10 * 1024 * 1024; // 10MB limit

    if (dataSize > maxSize) {
      return res.status(413).json({
        message:
          "Canvas data too large. Consider splitting into multiple memories.",
        size: dataSize,
        limit: maxSize,
      });
    }

    // Update with optimized data
    const updatedMemory = await db.query(
      // ...existing query...
      [title, optimizedCanvasData, thumbnail, id, req.user.id]
    );

    // ...existing code...
  } catch (error) {
    // ...existing error handling...
  }
});

// ...existing code...
```

## 4. Frontend Enhancements

### 4.1 Enhanced Canvas Controls

#### Object Manipulation Extensions

- Implement custom transformation handlers for selected objects
- Add rotation controls with numerical input for precise adjustments
- Implement scaling with aspect ratio preservation

```jsx
// Add to src/components/editor/TransformationControls.jsx
const TransformationControls = ({ selectedObject, canvas }) => {
  const [rotation, setRotation] = useState(selectedObject?.angle || 0);
  const [scale, setScale] = useState({
    x: selectedObject?.scaleX || 1,
    y: selectedObject?.scaleY || 1,
  });

  const handleRotationChange = (value) => {
    if (selectedObject) {
      selectedObject.set("angle", value);
      canvas.renderAll();
      setRotation(value);
      // Trigger canvas state update for auto-save
      canvas.fire("object:modified", { target: selectedObject });
    }
  };

  // Add similar handlers for scale

  return (
    <Box>
      <FormControl>
        <FormLabel>Rotation</FormLabel>
        <NumberInput
          value={rotation}
          onChange={handleRotationChange}
          min={0}
          max={360}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </FormControl>
      {/* Add scale controls */}
    </Box>
  );
};
```

### 4.2 Layer Management System

#### LayerManager Component

Create a new component to display and manage the stacking order of canvas objects:

```jsx
// Add to src/components/editor/LayerManager.jsx
import React from "react";
import {
  Box,
  List,
  ListItem,
  Button,
  Flex,
  Text,
  Icon,
} from "@chakra-ui/react";
import { MdArrowUpward, MdArrowDownward } from "react-icons/md";

const LayerManager = ({ canvas, selectedObject }) => {
  const [layers, setLayers] = useState([]);

  useEffect(() => {
    // Update layers whenever canvas objects change
    if (canvas) {
      setLayers(canvas.getObjects());

      const updateLayers = () => {
        setLayers([...canvas.getObjects()]);
      };

      canvas.on("object:added", updateLayers);
      canvas.on("object:removed", updateLayers);

      return () => {
        canvas.off("object:added", updateLayers);
        canvas.off("object:removed", updateLayers);
      };
    }
  }, [canvas]);

  const handleSelect = (obj) => {
    canvas.setActiveObject(obj);
    canvas.renderAll();
  };

  const moveUp = (obj) => {
    canvas.bringForward(obj);
    canvas.renderAll();
    setLayers([...canvas.getObjects()]);
  };

  const moveDown = (obj) => {
    canvas.sendBackwards(obj);
    canvas.renderAll();
    setLayers([...canvas.getObjects()]);
  };

  return (
    <Box borderWidth="1px" p={3} borderRadius="md">
      <Text fontWeight="bold" mb={2}>
        Layers
      </Text>
      <List spacing={2}>
        {layers.map((layer, index) => (
          <ListItem
            key={index}
            bg={selectedObject === layer ? "blue.50" : "transparent"}
            p={2}
            borderRadius="md"
            onClick={() => handleSelect(layer)}
            cursor="pointer"
          >
            <Flex justify="space-between" align="center">
              <Text>
                {layer.type === "image"
                  ? "Image"
                  : layer.type === "text"
                  ? `Text: ${layer.text.substring(0, 10)}...`
                  : layer.type === "path"
                  ? "Drawing"
                  : layer.type}
              </Text>
              <Box>
                <Button size="xs" onClick={() => moveUp(layer)} mr={1}>
                  <Icon as={MdArrowUpward} />
                </Button>
                <Button size="xs" onClick={() => moveDown(layer)}>
                  <Icon as={MdArrowDownward} />
                </Button>
              </Box>
            </Flex>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};
```

#### Integration with MemoryEditorPage

```jsx
// Update src/pages/MemoryEditorPage.jsx to include the LayerManager
// ...existing code...

// Import LayerManager
import LayerManager from "../components/editor/LayerManager";

// ...existing code...

// Add to the sidebar or tools area
<Box>
  {/* ...existing editor tools... */}
  <LayerManager canvas={canvas} selectedObject={selectedObject} />
</Box>;

// ...existing code...
```

### 4.3 Advanced Text Formatting

Extend the existing text tool with more formatting options:

```jsx
// Enhance src/components/editor/TextControls.jsx
const TextControls = ({ canvas, selectedObject }) => {
  // ...existing state...
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState(16);
  const [fontWeight, setFontWeight] = useState("normal");
  const [fontStyle, setFontStyle] = useState("normal");
  const [textAlign, setTextAlign] = useState("left");
  const [underline, setUnderline] = useState(false);

  // Apply text formatting
  const applyTextFormat = (property, value) => {
    if (selectedObject && selectedObject.type === "text") {
      selectedObject.set(property, value);
      canvas.renderAll();
      canvas.fire("object:modified", { target: selectedObject });
    }
  };

  // Font family handler
  const handleFontFamilyChange = (value) => {
    setFontFamily(value);
    applyTextFormat("fontFamily", value);
  };

  // Add similar handlers for other properties

  return (
    <Box>
      <Text fontWeight="bold" mb={2}>
        Text Formatting
      </Text>

      {/* Font Family */}
      <FormControl mb={2}>
        <FormLabel>Font</FormLabel>
        <Select
          value={fontFamily}
          onChange={(e) => handleFontFamilyChange(e.target.value)}
        >
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
          <option value="Verdana">Verdana</option>
        </Select>
      </FormControl>

      {/* Font Size */}
      <FormControl mb={2}>
        <FormLabel>Size</FormLabel>
        <NumberInput
          value={fontSize}
          onChange={(value) => {
            setFontSize(value);
            applyTextFormat("fontSize", parseInt(value));
          }}
          min={8}
          max={72}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </FormControl>

      {/* Style Controls */}
      <Flex mb={2}>
        <IconButton
          icon={<Icon as={MdFormatBold} />}
          isActive={fontWeight === "bold"}
          onClick={() => {
            const newWeight = fontWeight === "bold" ? "normal" : "bold";
            setFontWeight(newWeight);
            applyTextFormat("fontWeight", newWeight);
          }}
          mr={1}
        />
        <IconButton
          icon={<Icon as={MdFormatItalic} />}
          isActive={fontStyle === "italic"}
          onClick={() => {
            const newStyle = fontStyle === "italic" ? "normal" : "italic";
            setFontStyle(newStyle);
            applyTextFormat("fontStyle", newStyle);
          }}
          mr={1}
        />
        <IconButton
          icon={<Icon as={MdFormatUnderlined} />}
          isActive={underline}
          onClick={() => {
            setUnderline(!underline);
            applyTextFormat("underline", !underline);
          }}
        />
      </Flex>

      {/* Text Alignment */}
      <Flex>
        <IconButton
          icon={<Icon as={MdFormatAlignLeft} />}
          isActive={textAlign === "left"}
          onClick={() => {
            setTextAlign("left");
            applyTextFormat("textAlign", "left");
          }}
          mr={1}
        />
        <IconButton
          icon={<Icon as={MdFormatAlignCenter} />}
          isActive={textAlign === "center"}
          onClick={() => {
            setTextAlign("center");
            applyTextFormat("textAlign", "center");
          }}
          mr={1}
        />
        <IconButton
          icon={<Icon as={MdFormatAlignRight} />}
          isActive={textAlign === "right"}
          onClick={() => {
            setTextAlign("right");
            applyTextFormat("textAlign", "right");
          }}
        />
      </Flex>
    </Box>
  );
};
```

### 4.4 Multiple Brush Types for Drawing

Enhance the drawing tool to support various brush types:

```jsx
// Update src/components/editor/DrawingControls.jsx
const DrawingControls = ({ canvas }) => {
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushWidth, setBrushWidth] = useState(5);
  const [brushType, setBrushType] = useState("pencil"); // pencil, spray, pattern

  useEffect(() => {
    if (!canvas) return;

    // Configure brush
    canvas.freeDrawingBrush.color = brushColor;
    canvas.freeDrawingBrush.width = brushWidth;

    // Set brush type
    switch (brushType) {
      case "pencil":
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        break;
      case "spray":
        canvas.freeDrawingBrush = new fabric.SprayBrush(canvas);
        break;
      case "pattern":
        const pattern = new fabric.PatternBrush(canvas);
        canvas.freeDrawingBrush = pattern;
        break;
      default:
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    }

    // Re-apply color and width
    canvas.freeDrawingBrush.color = brushColor;
    canvas.freeDrawingBrush.width = brushWidth;
  }, [canvas, brushType, brushColor, brushWidth]);

  return (
    <Box>
      <Text fontWeight="bold" mb={2}>
        Drawing Tools
      </Text>

      {/* Brush Type */}
      <RadioGroup value={brushType} onChange={setBrushType} mb={3}>
        <Stack direction="row">
          <Radio value="pencil">Pencil</Radio>
          <Radio value="spray">Spray</Radio>
          <Radio value="pattern">Pattern</Radio>
        </Stack>
      </RadioGroup>

      {/* Brush Color */}
      <FormControl mb={3}>
        <FormLabel>Brush Color</FormLabel>
        <Input
          type="color"
          value={brushColor}
          onChange={(e) => setBrushColor(e.target.value)}
        />
      </FormControl>

      {/* Brush Width */}
      <FormControl>
        <FormLabel>Brush Width: {brushWidth}px</FormLabel>
        <Slider min={1} max={50} value={brushWidth} onChange={setBrushWidth}>
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb />
        </Slider>
      </FormControl>
    </Box>
  );
};
```

### 4.5 Undo/Redo System

Implement a history management system to allow undo/redo operations:

```jsx
// Create src/components/editor/HistoryManager.jsx
import React from "react";
import { Box, IconButton, Tooltip } from "@chakra-ui/react";
import { MdUndo, MdRedo } from "react-icons/md";

const HistoryManager = ({ canvas }) => {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    if (!canvas) return;

    // Set up history management
    if (!canvas._historyInit) {
      canvas.historyUndo = [];
      canvas.historyRedo = [];
      canvas._historyInit = true;

      const saveHistory = () => {
        // Save current state
        canvas.historyRedo = [];
        canvas.historyUndo.push(JSON.stringify(canvas));

        // Limit history size to prevent memory issues
        if (canvas.historyUndo.length > 30) {
          canvas.historyUndo.shift();
        }

        setCanUndo(canvas.historyUndo.length > 0);
        setCanRedo(canvas.historyRedo.length > 0);
      };

      canvas.on("object:modified", saveHistory);
      canvas.on("object:added", saveHistory);
      canvas.on("object:removed", saveHistory);
    }

    // Update button states
    setCanUndo(canvas.historyUndo && canvas.historyUndo.length > 0);
    setCanRedo(canvas.historyRedo && canvas.historyRedo.length > 0);

    return () => {
      canvas.off("object:modified");
      canvas.off("object:added");
      canvas.off("object:removed");
    };
  }, [canvas]);

  const handleUndo = () => {
    if (!canvas || !canvas.historyUndo || canvas.historyUndo.length === 0)
      return;

    // Save current state to redo stack
    canvas.historyRedo.push(JSON.stringify(canvas));

    // Get previous state
    const prevState = canvas.historyUndo.pop();

    // Load previous state
    canvas.loadFromJSON(prevState, canvas.renderAll.bind(canvas));

    // Update button states
    setCanUndo(canvas.historyUndo.length > 0);
    setCanRedo(canvas.historyRedo.length > 0);
  };

  const handleRedo = () => {
    if (!canvas || !canvas.historyRedo || canvas.historyRedo.length === 0)
      return;

    // Save current state to undo stack
    canvas.historyUndo.push(JSON.stringify(canvas));

    // Get next state
    const nextState = canvas.historyRedo.pop();

    // Load next state
    canvas.loadFromJSON(nextState, canvas.renderAll.bind(canvas));

    // Update button states
    setCanUndo(canvas.historyUndo.length > 0);
    setCanRedo(canvas.historyRedo.length > 0);
  };

  return (
    <Box>
      <Tooltip label="Undo">
        <IconButton
          icon={<MdUndo />}
          onClick={handleUndo}
          isDisabled={!canUndo}
          mr={2}
        />
      </Tooltip>
      <Tooltip label="Redo">
        <IconButton
          icon={<MdRedo />}
          onClick={handleRedo}
          isDisabled={!canRedo}
        />
      </Tooltip>
    </Box>
  );
};
```

#### Add HistoryManager to Editor

```jsx
// Update src/pages/MemoryEditorPage.jsx
// ...existing imports...
import HistoryManager from "../components/editor/HistoryManager";

// ...existing code...

// Add to the editor toolbar
<Flex justify="space-between" align="center" mb={4}>
  <Heading size="md">{memory.title}</Heading>
  <Box>
    <HistoryManager canvas={canvas} />
    {/* ...existing save button... */}
  </Box>
</Flex>;

// ...existing code...
```

## 5. Integration & Testing

### 5.1 Integration Testing Plan

1. Component-level tests for new editor features
2. End-to-end test for editing flow with advanced features
3. Performance testing with complex canvases

### 5.2 Manual Test Matrix

| Feature      | Test Case                  | Expected Result                        |
| ------------ | -------------------------- | -------------------------------------- |
| Rotation     | Rotate object with handle  | Object rotates smoothly                |
| Rotation     | Input exact angle value    | Object rotates to exact angle          |
| Scaling      | Resize with handles        | Object scales proportionally           |
| Layers       | List shows all objects     | All canvas objects appear in list      |
| Layers       | Move object up/down        | Object Z-index changes correctly       |
| Text Format  | Change font family         | Text updates with new font             |
| Text Format  | Apply bold/italic          | Text style updates accordingly         |
| Brush Types  | Switch between brush types | Drawing behavior changes appropriately |
| Undo/Redo    | Perform action and undo    | Canvas reverts to previous state       |
| Undo/Redo    | Perform undo then redo     | Canvas advances to next state          |
| Auto-save    | Make changes and wait      | Changes persist after reload           |
| Photo Upload | Upload photo               | Photo appears in canvas                |
| Photo Upload | Generate thumbnail         | Thumbnail is created                   |

## 6. Deployment Updates

### 6.1 Database Schema Updates

No schema changes are required for Phase 3, as the PostgreSQL JSONB field already supports the enhanced canvas data.

### 6.2 Environment Configuration

Ensure the following environment variables are set:

```
DB_CONNECTION_STRING=postgresql://username:password@host:port/database
JWT_SECRET=your-jwt-secret
UPLOAD_DIR=./uploads
BASE_URL=http://your-domain.com
```

### 6.3 Deployment Steps

1. Merge Phase 3 code to main branch
2. Run build process for frontend
3. Deploy updated frontend static assets
4. Restart backend service to pick up API changes
5. Verify functionality in production environment

## 7. Next Steps (Phase 4 Preview)

- Implement sharing mechanism
- Create view-only mode for shared memories
- Implement privacy controls
- Add expiration settings for shared links
- Create download controls
