#!/usr/bin/env node

/**
 * Cleanup Script
 * --------------
 * This script:
 * 1. Deletes all files in the photo storage directories
 * 2. Removes all records from photo-related database tables
 *
 * Use with caution as this will permanently delete data!
 */

import fs from "fs";
import process from "process";
import path from "path";
import { promisify } from "util";
import { pool } from "../db.js";

// Constants
const PHOTOS_DIR = path.join(process.cwd(), "file_storage", "photos");
const TEMP_PHOTOS_DIR = path.join(process.cwd(), "file_storage", "temp_photos");

// Promisify fs functions
const readdir = promisify(fs.readdir);
const unlink = promisify(fs.unlink);
const stat = promisify(fs.stat);

/**
 * Delete all files and subdirectories in a directory (recursive)
 * @param {string} directory - Directory path (recursive)
 */
async function cleanDirectory(directory) {
  try {
    console.log(`Cleaning directory: ${directory}`);

    // Check if directory exists
    try {
      await stat(directory);
    } catch {
      console.log(`Directory ${directory} does not exist. Skipping.`);
      return;
    }

    // Get all files
    const files = await readdir(directory, { withFileTypes: true });

    // Delete each file or directory
    let deletedCount = 0;
    for (const file of files) {
      const filePath = path.join(directory, file.name);

      if (file.isDirectory()) {
        // Recursively clean subdirectory
        await cleanDirectory(filePath);
        try {
          await fs.promises.rmdir(filePath); // Remove the empty directory
          console.log(`Deleted directory: ${filePath}`);
        } catch (err) {
          console.error(`Failed to delete directory ${filePath}:`, err);
        }
      } else {
        try {
          await unlink(filePath);
          deletedCount++;
        } catch (err) {
          console.error(`Failed to delete file ${filePath}:`, err);
        }
      }
    }

    console.log(`Deleted ${deletedCount} files from ${directory}`);
  } catch (err) {
    console.error(`Error cleaning directory ${directory}:`, err);
  }
}

/**
 * Clean the database tables in the correct order
 */
async function cleanDatabase() {
  const client = await pool.connect();

  try {
    console.log("Starting database cleanup...");

    // Begin transaction
    await client.query("BEGIN");

    // Delete records from tables in reverse dependency order
    const tables = [
      "memory_photos",
      "memory_view_configurations",
      "memories",
      "photos",
    ];

    for (const table of tables) {
      const result = await client.query(`DELETE FROM ${table}`);
      console.log(`Deleted ${result.rowCount} records from ${table}`);
    }

    // Commit transaction
    await client.query("COMMIT");
    console.log("Database cleanup completed successfully");
  } catch (err) {
    // Rollback transaction on error
    await client.query("ROLLBACK");
    console.error("Error during database cleanup:", err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Main cleanup function
 */
async function performCleanup() {
  try {
    console.log("Starting cleanup process...");

    // Clean directories
    await cleanDirectory(PHOTOS_DIR);
    await cleanDirectory(TEMP_PHOTOS_DIR);

    // Clean database
    await cleanDatabase();

    console.log("Cleanup completed successfully!");
    process.exit(0);
  } catch {
    console.error("Cleanup failed");
    process.exit(1);
  }
}

// Run the cleanup
performCleanup();
