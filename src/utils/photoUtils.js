import { appConfig } from "../config/appConfig";
import { deviceUtils } from "./deviceUtils";

export const photoUtils = {
  get config() {
    return appConfig();
  },
  /**
   * Calculate optimal display size for photos on canvas
   * @param {number} originalWidth - Original photo width
   * @param {number} originalHeight - Original photo height
   * @param {number} canvasWidth - Available canvas width
   * @param {number} canvasHeight - Available canvas height
   * @returns {Object} { width, height, scale, reason }
   */
  calculateDisplaySize: function (
    originalWidth,
    originalHeight,
    canvasWidth,
    canvasHeight
  ) {
    if (!canvasWidth || !canvasHeight) {
      const defaults = this.config.CANVAS.DEFAULT_DIMENSIONS;
      canvasWidth = canvasWidth || defaults.WIDTH;
      canvasHeight = canvasHeight || defaults.HEIGHT;
    }

    const screenSizeCategory = deviceUtils.getScreenSizeCategory(
      canvasWidth,
      canvasHeight
    );
    const config = this.config.PHOTO_DISPLAY.SIZE_CONFIGS[screenSizeCategory];

    console.log("📱 Screen size detection:", {
      canvasSize: { width: canvasWidth, height: canvasHeight },
      screenCategory: screenSizeCategory,
      config: config,
    });

    //const aspectRatio = originalWidth / originalHeight;
    const maxCanvasWidth = canvasWidth * config.maxCanvasRatio;
    const maxCanvasHeight = canvasHeight * config.maxCanvasRatio;

    // ✅ Add debug logging
    console.log("🔍 Photo sizing debug:", {
      original: { width: originalWidth, height: originalHeight },
      canvas: { width: canvasWidth, height: canvasHeight },
      maxCanvas: { width: maxCanvasWidth, height: maxCanvasHeight },
      config: config,
      smallThreshold: this.config.PHOTO_DISPLAY.SMALL_PHOTO_THRESHOLD,
    });

    let targetWidth, targetHeight, reason;

    // Case 1: Very small photos
    if (
      originalWidth < this.config.PHOTO_DISPLAY.SMALL_PHOTO_THRESHOLD ||
      originalHeight < this.config.PHOTO_DISPLAY.SMALL_PHOTO_THRESHOLD
    ) {
      console.log("📏 Case 1: Small photo optimization");
      // ... existing small photo logic
    }
    // Case 2: Large photos that exceed canvas bounds
    else if (
      originalWidth > maxCanvasWidth ||
      originalHeight > maxCanvasHeight
    ) {
      console.log("📏 Case 2: Large photo constraint");
      const canvasScale = Math.min(
        maxCanvasWidth / originalWidth,
        maxCanvasHeight / originalHeight
      );
      const maxSizeScale = Math.min(
        config.maxSize / originalWidth,
        config.maxSize / originalHeight
      );
      const finalScale = Math.min(canvasScale, maxSizeScale);

      console.log("🔍 Scaling calculations:", {
        canvasScale: canvasScale,
        maxSizeScale: maxSizeScale,
        finalScale: finalScale,
      });

      targetWidth = originalWidth * finalScale;
      targetHeight = originalHeight * finalScale;
      reason = `large_photo_constrained_${screenSizeCategory}`;
    }
    // Case 3: Medium photos
    else {
      console.log("📏 Case 3: Medium photo handling");
      const maxDimension = Math.max(originalWidth, originalHeight);
      console.log("🔍 Max dimension check:", {
        maxDimension: maxDimension,
        configMaxSize: config.maxSize,
        needsScaling: maxDimension > config.maxSize,
      });

      if (maxDimension > config.maxSize) {
        const scale = config.maxSize / maxDimension;
        targetWidth = originalWidth * scale;
        targetHeight = originalHeight * scale;
        reason = `medium_photo_scaled_${screenSizeCategory}`;
        console.log("🔍 Scaling medium photo:", { scale: scale });
      } else {
        targetWidth = originalWidth;
        targetHeight = originalHeight;
        reason = `original_size_kept_${screenSizeCategory}`;
        console.log("🔍 Keeping original size");
      }
    }

    const result = {
      width: Math.round(targetWidth),
      height: Math.round(targetHeight),
      scale: targetWidth / originalWidth,
      reason: reason,
      screenSizeCategory: screenSizeCategory,
    };

    console.log("🎯 Final sizing result:", result);

    return result;
  },
  // Determines starting quality based on original file size (as per md Step 4)
  // ✅ Updated to use config instead of hardcoded values
  _getStartingQuality: function (fileSize) {
    const thresholds = this.config.FILE_PROCESSING.QUALITY_THRESHOLDS;
    const levels = this.config.FILE_PROCESSING.QUALITY_LEVELS;

    if (fileSize <= thresholds.SMALL_FILE) return levels.SMALL_FILE; // Up to 2MB
    if (fileSize <= thresholds.MEDIUM_FILE) return levels.MEDIUM_FILE; // 2MB - 4MB
    if (fileSize <= thresholds.LARGE_FILE) return levels.LARGE_FILE; // 4MB - 8MB
    return levels.HUGE_FILE; // > 8MB
  },

  // Generates a list of quality values to try, from startingQuality down to minQuality
  _generateQualitiesToTry: function (startingQuality) {
    const minQuality = this.config.FILE_PROCESSING.MIN_COMPRESSION_QUALITY; // ✅ Use config
    const qualities = [];

    for (let q = startingQuality; q >= minQuality; q -= 0.1) {
      qualities.push(parseFloat(q.toFixed(1)));
    }

    if (!qualities.includes(minQuality) && startingQuality > minQuality) {
      qualities.push(minQuality);
    }

    if (qualities.length === 0 && startingQuality < minQuality) {
      qualities.push(minQuality);
    }

    return [...new Set(qualities)].sort((a, b) => b - a);
  },

  _generateWebPFileName: function (originalName) {
    const extension = this.config.FILE_PROCESSING.TARGET_FORMAT_EXTENSION; // ✅ Use config
    const nameWithoutExtension =
      originalName.substring(0, originalName.lastIndexOf(".")) || originalName;
    return `${nameWithoutExtension}${extension}`;
  },

  _loadImage: async function (file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => {
          console.error("Error loading image:", err);
          resolve(null); // Resolve with null on error to allow processImage to return original file
        };
        img.src = event.target.result;
      };
      reader.onerror = (err) => {
        console.error("FileReader error:", err);
        resolve(null); // Resolve with null on error
      };
      reader.readAsDataURL(file);
    });
  },

  _drawAndEncodeOnCanvas: async function (image, width, height, type, quality) {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      // Clear canvas to transparent before drawing to preserve transparency for WebP
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);

      canvas.toBlob(
        (blob) => resolve(blob),
        type,
        quality // For 'image/webp', undefined quality might aim for lossless or browser default high quality
      );
    });
  },

  processImage: async function (file) {
    const config = this.config.FILE_PROCESSING; // ✅ Get config once

    if (!file || !file.type || !file.type.startsWith("image/")) {
      return file;
    }

    // ✅ Use config values
    if (
      file.type === config.TARGET_FORMAT_TYPE &&
      file.size <= config.MAX_FILE_SIZE
    ) {
      return file;
    }

    const img = await this._loadImage(file);
    if (!img) {
      console.warn("Image loading failed, returning original file.");
      return file;
    }

    const originalWidth = img.width;
    const originalHeight = img.height;

    // Handle small non-WebP images
    if (
      file.type !== config.TARGET_FORMAT_TYPE &&
      file.size <= config.MAX_FILE_SIZE
    ) {
      const isPngOrSvg =
        file.type === "image/png" || file.type === "image/svg+xml";
      const qualityForSmallFile = isPngOrSvg ? undefined : 0.9;

      const blob = await this._drawAndEncodeOnCanvas(
        img,
        originalWidth,
        originalHeight,
        config.TARGET_FORMAT_TYPE, // ✅ Use config
        qualityForSmallFile
      );

      if (blob && blob.size <= config.MAX_FILE_SIZE) {
        // ✅ Use config
        return new File([blob], this._generateWebPFileName(file.name), {
          type: config.TARGET_FORMAT_TYPE, // ✅ Use config
        });
      }
    }

    // Specific path for SVG
    if (file.type === "image/svg+xml") {
      const blob = await this._drawAndEncodeOnCanvas(
        img,
        originalWidth,
        originalHeight,
        config.TARGET_FORMAT_TYPE, // ✅ Use config
        undefined
      );

      if (blob && blob.size <= config.MAX_FILE_SIZE) {
        // ✅ Use config
        return new File([blob], this._generateWebPFileName(file.name), {
          type: config.TARGET_FORMAT_TYPE, // ✅ Use config
        });
      }
      return file;
    }

    // Specific path for PNG
    if (file.type === "image/png") {
      const blob = await this._drawAndEncodeOnCanvas(
        img,
        originalWidth,
        originalHeight,
        config.TARGET_FORMAT_TYPE, // ✅ Use config
        undefined
      );

      if (blob && blob.size <= config.MAX_FILE_SIZE) {
        // ✅ Use config
        return new File([blob], this._generateWebPFileName(file.name), {
          type: config.TARGET_FORMAT_TYPE, // ✅ Use config
        });
      }
    }

    // General lossy compression strategy
    const startingQuality = this._getStartingQuality(file.size);
    const qualitiesToTry = this._generateQualitiesToTry(startingQuality);

    // Attempt with original dimensions, varying quality
    for (const quality of qualitiesToTry) {
      const blob = await this._drawAndEncodeOnCanvas(
        img,
        originalWidth,
        originalHeight,
        config.TARGET_FORMAT_TYPE, // ✅ Use config
        quality
      );

      if (blob && blob.size <= config.MAX_FILE_SIZE) {
        // ✅ Use config
        return new File([blob], this._generateWebPFileName(file.name), {
          type: config.TARGET_FORMAT_TYPE, // ✅ Use config
        });
      }
    }

    // ✅ Fix the resize section - this was the main error
    const resizeWidthsToTry = config.RESIZE_TARGET_WIDTHS.filter(
      // ✅ Use config
      (w) => w < originalWidth && w > 0
    );

    for (const targetWidth of resizeWidthsToTry) {
      const targetHeight = Math.round(
        originalHeight * (targetWidth / originalWidth)
      );
      if (targetHeight <= 0) continue;

      for (const quality of qualitiesToTry) {
        const blob = await this._drawAndEncodeOnCanvas(
          img,
          targetWidth,
          targetHeight,
          config.TARGET_FORMAT_TYPE, // ✅ Use config
          quality
        );

        if (blob && blob.size <= config.MAX_FILE_SIZE) {
          // ✅ Use config
          return new File([blob], this._generateWebPFileName(file.name), {
            type: config.TARGET_FORMAT_TYPE, // ✅ Use config
          });
        }
      }
    }

    // If all attempts fail
    console.warn(
      `All compression attempts failed to bring the image under ${
        config.MAX_FILE_SIZE / (1024 * 1024) // ✅ Use config
      }MB. Returning original file.`
    );
    return file;
  },
};

export default photoUtils;
