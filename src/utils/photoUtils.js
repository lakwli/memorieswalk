export const photoUtils = {
  // Configuration
  MAX_FILE_SIZE: 1024 * 1024, // 1MB in bytes
  MIN_COMPRESSION_QUALITY: 0.5, // Minimum quality level for lossy compression
  // Resize target widths, from larger to smaller.
  // MAX_DIMENSION from original was 1200, using it as the smallest common target.
  RESIZE_TARGET_WIDTHS: [2048, 1600, 1200],
  TARGET_FORMAT_TYPE: "image/webp",
  TARGET_FORMAT_EXTENSION: ".webp",

  // Determines starting quality based on original file size (as per md Step 4)
  _getStartingQuality: function (fileSize) {
    if (fileSize <= 2 * 1024 * 1024) return 0.8; // Up to 2MB
    if (fileSize <= 4 * 1024 * 1024) return 0.7; // 2MB - 4MB
    if (fileSize <= 8 * 1024 * 1024) return 0.6; // 4MB - 8MB
    return 0.5; // > 8MB
  },

  // Generates a list of quality values to try, from startingQuality down to minQuality
  _generateQualitiesToTry: function (startingQuality) {
    const qualities = [];
    for (let q = startingQuality; q >= this.MIN_COMPRESSION_QUALITY; q -= 0.1) {
      qualities.push(parseFloat(q.toFixed(1)));
    }
    if (
      !qualities.includes(this.MIN_COMPRESSION_QUALITY) &&
      startingQuality > this.MIN_COMPRESSION_QUALITY
    ) {
      qualities.push(this.MIN_COMPRESSION_QUALITY);
    }
    if (
      qualities.length === 0 &&
      startingQuality < this.MIN_COMPRESSION_QUALITY
    ) {
      qualities.push(this.MIN_COMPRESSION_QUALITY); // Ensure at least min_quality is tried
    }
    // Ensure unique values, in case of floating point issues, though toFixed(1) should handle it.
    return [...new Set(qualities)].sort((a, b) => b - a);
  },

  _generateWebPFileName: function (originalName) {
    const nameWithoutExtension =
      originalName.substring(0, originalName.lastIndexOf(".")) || originalName;
    return `${nameWithoutExtension}${this.TARGET_FORMAT_EXTENSION}`;
  },

  _loadImage: async function (file) {
    return new Promise((resolve, reject) => {
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
    if (!file || !file.type || !file.type.startsWith("image/")) {
      return file; // Not an image or invalid file object
    }

    // If already WebP and within size limit, no processing needed.
    if (
      file.type === this.TARGET_FORMAT_TYPE &&
      file.size <= this.MAX_FILE_SIZE
    ) {
      return file;
    }

    const img = await this._loadImage(file);
    if (!img) {
      console.warn("Image loading failed, returning original file.");
      return file; // Loading failed
    }

    const originalWidth = img.width;
    const originalHeight = img.height;
    let processedFile = null;

    // Handle small non-WebP images: convert to WebP with high quality/lossless attempt.
    if (
      file.type !== this.TARGET_FORMAT_TYPE &&
      file.size <= this.MAX_FILE_SIZE
    ) {
      const isPngOrSvg =
        file.type === "image/png" || file.type === "image/svg+xml";
      const qualityForSmallFile = isPngOrSvg ? undefined : 0.9; // Undefined for lossless attempt (PNG/SVG), 0.9 for others

      const blob = await this._drawAndEncodeOnCanvas(
        img,
        originalWidth,
        originalHeight,
        this.TARGET_FORMAT_TYPE,
        qualityForSmallFile
      );
      if (blob && blob.size <= this.MAX_FILE_SIZE) {
        return new File([blob], this._generateWebPFileName(file.name), {
          type: this.TARGET_FORMAT_TYPE,
        });
      }
      // If this conversion is too large, it will proceed to the main compression logic.
    }

    // Specific path for SVG: Try lossless WebP at original dimensions.
    // If >1MB, return original file as per strict interpretation of spec for SVG.
    if (file.type === "image/svg+xml") {
      const blob = await this._drawAndEncodeOnCanvas(
        img,
        originalWidth,
        originalHeight,
        this.TARGET_FORMAT_TYPE,
        undefined
      ); // Undefined quality for lossless attempt
      if (blob && blob.size <= this.MAX_FILE_SIZE) {
        return new File([blob], this._generateWebPFileName(file.name), {
          type: this.TARGET_FORMAT_TYPE,
        });
      }
      return file; // SVG as lossless WebP > 1MB, return original
    }

    // Specific path for PNG: Try lossless WebP first.
    if (file.type === "image/png") {
      const blob = await this._drawAndEncodeOnCanvas(
        img,
        originalWidth,
        originalHeight,
        this.TARGET_FORMAT_TYPE,
        undefined
      ); // Attempt lossless
      if (blob && blob.size <= this.MAX_FILE_SIZE) {
        return new File([blob], this._generateWebPFileName(file.name), {
          type: this.TARGET_FORMAT_TYPE,
        });
      }
      // If lossless WebP from PNG is > 1MB, continue to general lossy compression below.
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
        this.TARGET_FORMAT_TYPE,
        quality
      );
      if (blob && blob.size <= this.MAX_FILE_SIZE) {
        return new File([blob], this._generateWebPFileName(file.name), {
          type: this.TARGET_FORMAT_TYPE,
        });
      }
    }

    // If still too large, attempt resizing then varying quality
    const resizeWidthsToTry = this.RESIZE_TARGET_WIDTHS.filter(
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
          this.TARGET_FORMAT_TYPE,
          quality
        );
        if (blob && blob.size <= this.MAX_FILE_SIZE) {
          return new File([blob], this._generateWebPFileName(file.name), {
            type: this.TARGET_FORMAT_TYPE,
          });
        }
      }
    }

    // If all attempts fail, return the original file.
    console.warn(
      `All compression attempts failed to bring the image under ${
        this.MAX_FILE_SIZE / (1024 * 1024)
      }MB. Returning original file.`
    );
    return file;
  },
};

export default photoUtils;
