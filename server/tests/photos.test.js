import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import path from "path";
import { fileURLToPath } from "url";
import app from "../index.js";
import { pool } from "../db.js";
import { ELEMENT_STATES } from "../constants/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Photo State Values Used in Tests:
 * ELEMENT_STATES.NEW = "N" (temporary storage)
 * ELEMENT_STATES.PERSISTED = "P" (permanent storage)
 * ELEMENT_STATES.REMOVED = "R" (marked for deletion)
 */

describe("Photo Management", () => {
  let authToken;
  let userId;
  let memoryId;
  let uploadedPhotoId;
  const samplePhotoPath = path.join(__dirname, "assets/sample.png");

  beforeAll(async () => {
    // Create test user and get auth token
    const userResponse = await request(app)
      .post("/api/auth/register")
      .send({
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: "testpassword123",
      });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: userResponse.body.email,
      password: "testpassword123",
    });

    authToken = loginResponse.body.token;
    userId = loginResponse.body.userId;

    // Create a test memory
    const memoryResponse = await request(app)
      .post("/api/memories")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "Test Memory",
        description: "Test Description",
      });

    memoryId = memoryResponse.body.id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (memoryId) {
      await request(app)
        .delete(`/api/memories/${memoryId}`)
        .set("Authorization", `Bearer ${authToken}`);
    }

    // Delete test user and their data
    await pool.query("DELETE FROM users WHERE id = $1", [userId]);

    // Close database connection
    await pool.end();
  });

  describe("Photo Upload and State Management", () => {
    it("should upload a photo to temporary storage", async () => {
      const response = await request(app)
        .post("/api/photos/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("photos", samplePhotoPath);

      expect(response.status).toBe(201);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toHaveProperty("id");
      expect(response.body[0]).toHaveProperty("state", ELEMENT_STATES.NEW);

      uploadedPhotoId = response.body[0].id;
    });

    it("should retrieve a temporary photo", async () => {
      const response = await request(app)
        .get(
          `/api/photos/retrieve/${uploadedPhotoId}?state=${ELEMENT_STATES.NEW}`
        )
        .set("Authorization", `Bearer ${authToken}`)
        .expect("Content-Type", /image/);

      expect(response.status).toBe(200);
    });

    it("should save memory with new photo", async () => {
      const response = await request(app)
        .put(`/api/memories/${memoryId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Updated Memory",
          description: "Updated Description",
          canvas: {},
          photos: [{ id: uploadedPhotoId, state: ELEMENT_STATES.NEW }],
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("photo_ids");
      expect(response.body.photo_ids).toContain(uploadedPhotoId);
    });

    it("should retrieve saved photo as permanent", async () => {
      const response = await request(app)
        .get(
          `/api/photos/retrieve/${uploadedPhotoId}?state=${ELEMENT_STATES.PERSISTED}`
        )
        .set("Authorization", `Bearer ${authToken}`)
        .expect("Content-Type", /image/);

      expect(response.status).toBe(200);
    });

    it("should handle photo removal", async () => {
      const response = await request(app)
        .put(`/api/memories/${memoryId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Updated Memory",
          description: "Updated Description",
          canvas: {},
          photos: [{ id: uploadedPhotoId, state: ELEMENT_STATES.REMOVED }],
        });

      expect(response.status).toBe(200);
      expect(response.body.photo_ids).not.toContain(uploadedPhotoId);

      // Verify photo is no longer accessible
      const photoResponse = await request(app)
        .get(
          `/api/photos/retrieve/${uploadedPhotoId}?state=${ELEMENT_STATES.PERSISTED}`
        )
        .set("Authorization", `Bearer ${authToken}`);

      expect(photoResponse.status).toBe(404);
    });
  });

  describe("Access Control", () => {
    let otherUserToken;
    let tempPhotoId;

    beforeAll(async () => {
      // Create another test user
      const userResponse = await request(app)
        .post("/api/auth/register")
        .send({
          username: `testuser2_${Date.now()}`,
          email: `test2_${Date.now()}@example.com`,
          password: "testpassword123",
        });

      const loginResponse = await request(app).post("/api/auth/login").send({
        email: userResponse.body.email,
        password: "testpassword123",
      });

      otherUserToken = loginResponse.body.token;

      // Upload a temporary photo
      const uploadResponse = await request(app)
        .post("/api/photos/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("photos", samplePhotoPath);

      tempPhotoId = uploadResponse.body[0].id;
    });

    it("should prevent other users from accessing temporary photos", async () => {
      const response = await request(app)
        .get(`/api/photos/retrieve/${tempPhotoId}?state=${ELEMENT_STATES.NEW}`)
        .set("Authorization", `Bearer ${otherUserToken}`);

      expect(response.status).toBe(403);
    });

    it("should prevent unauthorized access to permanent photos", async () => {
      // First save the photo to make it permanent
      await request(app)
        .put(`/api/memories/${memoryId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Test Memory",
          description: "Test Description",
          canvas: {},
          photos: [{ id: tempPhotoId, state: ELEMENT_STATES.NEW }],
        });

      // Try to access with other user
      const response = await request(app)
        .get(
          `/api/photos/retrieve/${tempPhotoId}?state=${ELEMENT_STATES.PERSISTED}`
        )
        .set("Authorization", `Bearer ${otherUserToken}`);

      expect(response.status).toBe(403);
    });
  });
});
