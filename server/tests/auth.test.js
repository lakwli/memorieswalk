import pool from "../db.js";

async function testAuth() {
  try {
    console.log("🔍 Testing database connection...");
    const dbResult = await pool.query("SELECT NOW()");
    console.log("✅ Database connected successfully");

    console.log("\n🔍 Testing users table...");
    const usersResult = await pool.query("SELECT username, role FROM users");
    console.log("📊 Current users:", usersResult.rows);

    console.log("\n🔍 Testing auth with admin credentials...");
    const authResult = await pool.query(
      "SELECT id, username, role FROM users WHERE username = $1 AND password_hash = $2",
      ["admin", "admin"]
    );

    if (authResult.rows.length > 0) {
      console.log("✅ Found user:", authResult.rows[0]);
    } else {
      console.log("❌ Auth failed: User not found or incorrect password");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await pool.end();
  }
}

testAuth();
