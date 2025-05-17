import { describe, beforeAll, afterAll, it, expect } from "@jest/globals";
import request from "supertest";
import app from "../index.js"; // Assuming app is exported from index.js
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import pool from "../db.js"; // Import the pool to close it

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to log in and get a token
// Updated password
const getAuthToken = async (username = "admin", password = "admin") => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ username, password });
  return response.body.token;
};

describe("Memory End-to-End Workflow", () => {
  let authToken;
  let memoryId;
  let photoId;
  let uploadedPhotoFilePath; // To store the relative path from the API response
  let viewConfigId;

  const samplePhotoPath = path.join(__dirname, "assets", "sample.png");

  beforeAll(async () => {
    authToken = await getAuthToken();
    // Ensure the assets directory exists
    const assetsDir = path.join(__dirname, "assets");
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir);
    }
    // Ensure sample.png exists, if not, log a message to manually add it.
    if (!fs.existsSync(samplePhotoPath)) {
      console.warn(
        `Test asset /workspace/server/tests/assets/sample.png not found. Please add a valid small PNG file to this location for photo upload tests to pass.`
      );
      // Optionally, create the tiny placeholder if you want tests to run but potentially fail at sharp processing
      // fs.writeFileSync(
      //   samplePhotoPath,
      //   Buffer.from(
      //     "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      //     "base64"
      //   )
      // );
    }
  });

  afterAll(async () => {
    // Clean up created resources
    // Note: Order matters due to dependencies / foreign key constraints if not using CASCADE properly everywhere
    // For robust cleanup, it's often better to let the DB cascade or delete in reverse order of creation.

    if (photoId && authToken) {
      try {
        // Delete the photo from the user's library (this should also handle file deletion if implemented in the route)
        await request(app)
          .delete(`/api/memories/photos/${photoId}`) // Corrected path
          .set("Authorization", `Bearer ${authToken}`);
        console.log(`Cleaned up photo: ${photoId}`);
      } catch (err) {
        console.error(`Error cleaning up photo ${photoId}:`, err.message);
      }
    }

    // If the photo file wasn't deleted by the DELETE /api/photos/:photoId route (e.g., if that route only handles DB)
    // and we have the uploadedPhotoFilePath (full server path), we might need to delete it manually.
    // However, the fileUtils.deleteFile in the route should handle this.
    // For now, we assume the API route handles file cleanup.

    if (memoryId && authToken) {
      try {
        await request(app)
          .delete(`/api/memories/${memoryId}`)
          .set("Authorization", `Bearer ${authToken}`);
        console.log(`Cleaned up memory: ${memoryId}`);
        // View configurations and memory_photos links should be cleaned by CASCADE DELETE in DB
      } catch (err) {
        console.error(`Error cleaning up memory ${memoryId}:`, err.message);
      }
    }
    await pool.end(); // Close the database pool
  });

  it("Step 1: should create a new memory", async () => {
    const response = await request(app)
      .post("/api/memories")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "Test Memory E2E",
        description: "A memory created for end-to-end testing.",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.title).toBe("Test Memory E2E");
    memoryId = response.body.id;
    console.log(`Created memory with ID: ${memoryId}`);
  });

  it("Step 2: should create a canvas view configuration for the memory", async () => {
    expect(memoryId).toBeDefined(); // Ensure memoryId was set
    const response = await request(app)
      .post(`/api/memories/${memoryId}/views`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Test Canvas View",
        view_type: "canvas",
        configuration_data: { objects: [], background: "#ffffff" }, // Basic canvas data
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.name).toBe("Test Canvas View");
    expect(response.body.view_type).toBe("canvas");
    viewConfigId = response.body.id;
    console.log(
      `Created view configuration with ID: ${viewConfigId} for memory ${memoryId}`
    );
  });

  it("Step 3: should upload a photo to the user's library", async () => {
    const response = await request(app)
      .post("/api/memories/photos") // Corrected path
      .set("Authorization", `Bearer ${authToken}`)
      .attach("photos", samplePhotoPath); // 'photos' is the field name expected by upload.array('photos', 10)

    expect(response.status).toBe(201);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty("id");
    expect(response.body[0]).toHaveProperty("file_path");
    photoId = response.body[0].id;
    uploadedPhotoFilePath = response.body[0].file_path; // Store relative path
    console.log(
      `Uploaded photo with ID: ${photoId}, path: ${uploadedPhotoFilePath}`
    );
  });

  it("Step 4: should link the uploaded photo to the memory", async () => {
    expect(memoryId).toBeDefined();
    expect(photoId).toBeDefined();

    const response = await request(app)
      .post(`/api/memories/${memoryId}/photos`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ photo_ids: [photoId] });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("links");
    expect(Array.isArray(response.body.links)).toBe(true);
    // Check if the specific link was reported (optional, depends on API response structure)
    const link = response.body.links.find(
      (l) => l.memory_id === memoryId && l.photo_id === photoId
    );
    expect(link).toBeDefined();
    console.log(`Linked photo ${photoId} to memory ${memoryId}`);
  });

  it("Step 5: should retrieve the memory with linked photo and view configuration", async () => {
    expect(memoryId).toBeDefined();
    const response = await request(app)
      .get(`/api/memories/${memoryId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    const memory = response.body;
    expect(memory.id).toBe(memoryId);
    expect(memory.title).toBe("Test Memory E2E");

    // Check for linked photo
    expect(Array.isArray(memory.photos)).toBe(true);
    const linkedPhoto = memory.photos.find((p) => p.id === photoId);
    expect(linkedPhoto).toBeDefined();
    expect(linkedPhoto.file_path).toBe(uploadedPhotoFilePath); // Verify the path matches

    // Check for view configuration
    expect(Array.isArray(memory.view_configurations)).toBe(true);
    const viewConf = memory.view_configurations.find(
      (vc) => vc.id === viewConfigId
    );
    expect(viewConf).toBeDefined();
    expect(viewConf.name).toBe("Test Canvas View");
    expect(viewConf.view_type).toBe("canvas");

    console.log(
      `Successfully retrieved memory ${memoryId} with its photo and view configuration.`
    );
  });
});
