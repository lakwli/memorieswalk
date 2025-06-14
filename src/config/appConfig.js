export const APP_CONFIG = {
  UI: {
    TOOLBAR: {
      WIDTH: 280, // Toolbar width
      HEIGHT: 60, // Toolbar height
      CLEARANCE_ABOVE: 60, // Space above element
      MARGIN: 10, // Minimum distance from screen edges
      FALLBACK_OFFSET: 80, // Vertical offset for fallback positioning
    },
  },
  // ✅ Canvas & Stage Configuration
  CANVAS: {
    STAGE_OFFSET: {
      WIDTH: 60, // Stage width offset from window
      HEIGHT: 120, // Stage height offset from window
    },
    // ✅ Add default dimensions
    DEFAULT_DIMENSIONS: {
      WIDTH: 1000,
      HEIGHT: 600,
    },
  },

  // ✅ Photo Display Configuration (just moved the existing numbers)
  PHOTO_DISPLAY: {
    MIN_SIZE: 150,
    MAX_SIZE: 400,
    MAX_CANVAS_RATIO: 0.3,
    SMALL_PHOTO_THRESHOLD: 300,

    // ✅ Screen size based configurations (not device type)
    SIZE_CONFIGS: {
      small: {
        // Small screens
        minSize: 120,
        maxSize: 280,
        maxCanvasRatio: 0.6,
      },
      medium: {
        // Medium screens
        minSize: 150,
        maxSize: 400,
        maxCanvasRatio: 0.45,
      },
      large: {
        // Large screens
        minSize: 180,
        maxSize: 500,
        maxCanvasRatio: 0.35,
      },
      xlarge: {
        // Extra large screens
        minSize: 200,
        maxSize: 600,
        maxCanvasRatio: 0.3,
      },
    },
  },

  // ✅ File Processing Configuration (just moved the existing numbers)
  FILE_PROCESSING: {
    MAX_FILE_SIZE: 1024 * 1024, // 1MB
    MIN_COMPRESSION_QUALITY: 0.5,
    RESIZE_TARGET_WIDTHS: [2048, 1600, 1200],
    TARGET_FORMAT_TYPE: "image/webp",
    TARGET_FORMAT_EXTENSION: ".webp",

    QUALITY_THRESHOLDS: {
      SMALL_FILE: 2 * 1024 * 1024, // 2MB
      MEDIUM_FILE: 4 * 1024 * 1024, // 4MB
      LARGE_FILE: 8 * 1024 * 1024, // 8MB
    },

    QUALITY_LEVELS: {
      SMALL_FILE: 0.8, // Up to 2MB
      MEDIUM_FILE: 0.7, // 2MB - 4MB
      LARGE_FILE: 0.6, // 4MB - 8MB
      HUGE_FILE: 0.5, // > 8MB
    },
  },
};

// ✅ Simple getter function
export const appConfig = () => APP_CONFIG;
