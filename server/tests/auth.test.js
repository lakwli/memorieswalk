import dotenv from "dotenv";
import pool from "../db.js";
import bcrypt from "bcrypt";
import { describe, afterAll, test, expect } from "@jest/globals";

dotenv.config();

describe("Authentication", () => {
  afterAll(async () => {
    await pool.end();
  });

  describe("Admin Login Tests", () => {
    test("login with admin-admin", async () => {
      const result = await pool.query(
        "SELECT password_hash FROM users WHERE username = $1",
        ["admin"]
      );
      const hash = result.rows[0].password_hash;
      const isValid = await bcrypt.compare("admin", hash);
      expect(isValid).toBe(true);
    });

    test("login with admin-admin123", async () => {
      const result = await pool.query(
        "SELECT password_hash FROM users WHERE username = $1",
        ["admin"]
      );
      const hash = result.rows[0].password_hash;
      const isValid = await bcrypt.compare("admin123", hash);
      expect(isValid).toBe(false); // Corrected expectation: admin123 is NOT the password
    });
  });
});
