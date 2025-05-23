import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import {
  jest,
  expect,
  describe,
  beforeAll,
  afterAll,
  beforeEach,
  test,
} from "@jest/globals";
import { cleanupTempFiles } from "../schedulers/cleanTempFiles.js";
import { FILE_STORAGE_CONFIG } from "../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("cleanupTempFiles", () => {
  // Path to test temp directory
  const testTempDir = path.join(__dirname, "assets", "test_temp_files");

  // Mock the FILE_STORAGE_CONFIG to use our test directory
  const originalTempDir = FILE_STORAGE_CONFIG.TEMP_PHOTOS_DIR;
  const originalMaxAge = FILE_STORAGE_CONFIG.CLEANUP.MAX_AGE_MS;

  beforeAll(() => {
    // Create test directory if it doesn't exist
    if (!fs.existsSync(testTempDir)) {
      fs.mkdirSync(testTempDir, { recursive: true });
    }

    // Override the config temporarily
    FILE_STORAGE_CONFIG.TEMP_PHOTOS_DIR = testTempDir;
    // Set max age to 5 minutes for testing
    FILE_STORAGE_CONFIG.CLEANUP.MAX_AGE_MS = 5 * 60 * 1000;
  });

  afterAll(() => {
    // Restore original config
    FILE_STORAGE_CONFIG.TEMP_PHOTOS_DIR = originalTempDir;
    FILE_STORAGE_CONFIG.CLEANUP.MAX_AGE_MS = originalMaxAge;

    // Clean up test directory
    if (fs.existsSync(testTempDir)) {
      const files = fs.readdirSync(testTempDir);
      for (const file of files) {
        const filePath = path.join(testTempDir, file);
        if (fs.statSync(filePath).isDirectory()) {
          // Recursively remove directory
          fs.rmSync(filePath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(filePath);
        }
      }
    }
  });

  beforeEach(() => {
    // Clean the test directory before each test
    if (fs.existsSync(testTempDir)) {
      const files = fs.readdirSync(testTempDir);
      for (const file of files) {
        const filePath = path.join(testTempDir, file);
        if (fs.statSync(filePath).isDirectory()) {
          // Recursively remove directory
          fs.rmSync(filePath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(filePath);
        }
      }
    }
  });

  test("should not delete files newer than max age", async () => {
    // Create a new file
    const newFilePath = path.join(testTempDir, "new-file.jpg");
    fs.writeFileSync(newFilePath, "test content");

    // Run cleanup
    const result = await cleanupTempFiles();

    // Should not delete any files
    expect(result.deleted).toBe(0);
    expect(fs.existsSync(newFilePath)).toBe(true);
  });

  test("should delete files older than max age", async () => {
    // Create a file
    const oldFilePath = path.join(testTempDir, "old-file.jpg");
    fs.writeFileSync(oldFilePath, "test content");

    // Modify the file time to be older than the max age
    const now = new Date();
    const oldTime = new Date(
      now.getTime() - FILE_STORAGE_CONFIG.CLEANUP.MAX_AGE_MS * 2
    );
    fs.utimesSync(oldFilePath, oldTime, oldTime);

    // Run cleanup
    const result = await cleanupTempFiles();

    // Should delete the old file
    expect(result.deleted).toBe(1);
    expect(fs.existsSync(oldFilePath)).toBe(false);
  });

  test("should handle mixed old and new files correctly", async () => {
    // Create a new file
    const newFilePath = path.join(testTempDir, "new-file.jpg");
    fs.writeFileSync(newFilePath, "new content");

    // Create an old file
    const oldFilePath = path.join(testTempDir, "old-file.jpg");
    fs.writeFileSync(oldFilePath, "old content");

    // Modify the file time to be older than the max age
    const now = new Date();
    const oldTime = new Date(
      now.getTime() - FILE_STORAGE_CONFIG.CLEANUP.MAX_AGE_MS * 2
    );
    fs.utimesSync(oldFilePath, oldTime, oldTime);

    // Run cleanup
    const result = await cleanupTempFiles();

    // Should delete only the old file
    expect(result.deleted).toBe(1);
    expect(fs.existsSync(newFilePath)).toBe(true);
    expect(fs.existsSync(oldFilePath)).toBe(false);
  });

  test("should handle directories correctly", async () => {
    // Create a subdirectory
    const subDir = path.join(testTempDir, "subdir");
    if (!fs.existsSync(subDir)) {
      fs.mkdirSync(subDir);
    }

    // Create a file in the subdirectory
    const subDirFilePath = path.join(subDir, "file-in-subdir.jpg");
    fs.writeFileSync(subDirFilePath, "subdir content");

    // Modify the file time to be older than the max age
    const now = new Date();
    const oldTime = new Date(
      now.getTime() - FILE_STORAGE_CONFIG.CLEANUP.MAX_AGE_MS * 2
    );
    fs.utimesSync(subDirFilePath, oldTime, oldTime);

    // Run cleanup
    const result = await cleanupTempFiles();

    // The cleanup should ignore subdirectories
    expect(result.deleted).toBe(0);
    expect(fs.existsSync(subDir)).toBe(true);
    expect(fs.existsSync(subDirFilePath)).toBe(true);
  });

  test("should handle errors gracefully", async () => {
    // Create a test file that we'll make inaccessible
    const testFilePath = path.join(testTempDir, "error-file.jpg");
    fs.writeFileSync(testFilePath, "test content");

    // Modify the file time to be older than the max age
    const now = new Date();
    const oldTime = new Date(
      now.getTime() - FILE_STORAGE_CONFIG.CLEANUP.MAX_AGE_MS * 2
    );
    fs.utimesSync(testFilePath, oldTime, oldTime);

    // Mock fs.unlinkSync to throw an error for this specific file
    const originalUnlinkSync = fs.unlinkSync;
    fs.unlinkSync = jest.fn((path) => {
      if (path === testFilePath) {
        throw new Error("Mock error");
      }
      return originalUnlinkSync(path);
    });

    // Run cleanup
    const result = await cleanupTempFiles();

    // Should have encountered an error
    expect(result.errors).toBe(1);
    expect(result.deleted).toBe(0);

    // Restore original function
    fs.unlinkSync = originalUnlinkSync;
  });
});
