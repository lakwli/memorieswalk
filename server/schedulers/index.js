import { cleanupTempFiles } from "./cleanTempFiles.js";
import { FILE_STORAGE_CONFIG } from "../config.js";
import process from "process";

// Track active intervals for graceful shutdown
let intervals = {
  tempFileCleanup: null,
};

// Flag to track whether schedulers have been initialized
let schedulersInitialized = false;

/**
 * Initializes all schedulers based on their configurations
 */
export function initializeSchedulers() {
  // Prevent multiple initializations
  if (schedulersInitialized) {
    console.log("Schedulers already initialized, skipping...");
    return;
  }

  // Initialize temp file cleanup scheduler
  startTempFileCleanupScheduler();

  // Add any future schedulers here

  // Setup graceful shutdown
  setupGracefulShutdown();

  // Mark as initialized
  schedulersInitialized = true;
}

/**
 * Starts the temp file cleanup scheduler
 */
function startTempFileCleanupScheduler() {
  const config = FILE_STORAGE_CONFIG.CLEANUP;

  // Only start if enabled in config
  if (!config.ENABLED) {
    console.log("Temp file cleanup scheduler is disabled");
    return;
  }

  // Log scheduler configuration
  console.log(
    `Starting temp file cleanup scheduler with interval: ${
      config.INTERVAL_MS / 1000 / 60
    } minutes`
  );
  console.log(
    `Files older than ${config.MAX_AGE_MS / 1000 / 60} minutes will be deleted`
  );

  // Clear any existing interval
  if (intervals.tempFileCleanup) {
    clearInterval(intervals.tempFileCleanup);
  }

  // Run cleanup immediately on startup
  cleanupTempFiles()
    .then((stats) => {
      console.log(`Initial cleanup completed: ${stats.deleted} files deleted`);
    })
    .catch((err) => {
      console.error("Error during initial cleanup:", err);
    });

  // Schedule regular cleanup
  intervals.tempFileCleanup = setInterval(async () => {
    try {
      await cleanupTempFiles();
    } catch (err) {
      console.error("Error during scheduled cleanup:", err);
    }
  }, config.INTERVAL_MS);
}

/**
 * Sets up graceful shutdown of schedulers
 */
function setupGracefulShutdown() {
  // Handle app termination
  process.on("SIGTERM", () => {
    console.log("SIGTERM signal received: shutting down schedulers");
    shutdownSchedulers();
  });

  // Handle Ctrl+C
  process.on("SIGINT", () => {
    console.log("SIGINT signal received: shutting down schedulers");
    shutdownSchedulers();
  });
}

/**
 * Shuts down all schedulers gracefully
 * @returns {Promise<void>} A promise that resolves when all cleanup is complete
 */
export function shutdownSchedulers() {
  // Stop temp file cleanup scheduler
  if (intervals.tempFileCleanup) {
    clearInterval(intervals.tempFileCleanup);
    intervals.tempFileCleanup = null;
    console.log("Temp file cleanup scheduler stopped");
  }

  // Force immediate release of all resources
  process._getActiveHandles().forEach((handle) => {
    // Close any active file handles that might be from our cleanup process
    if (
      handle &&
      typeof handle.close === "function" &&
      handle.fd !== undefined
    ) {
      try {
        handle.close();
      } catch {
        // Ignore errors on close
      }
    }
  });

  // Add any future scheduler shutdowns here
}

export default {
  initializeSchedulers,
  shutdownSchedulers,
};
