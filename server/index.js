import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import process from "process";
import pool from "./db.js";
import authRoutes from "./routes/auth.js";
import canvasRoutes from "./routes/canvas.js"; // Keep for backward compatibility
import memoryRoutes from "./routes/memory.js";
import memoryRoutesDetailed from "./routes/memoryRoutes.js";
import userRoutes from "./routes/userRoutes.js"; // Add this line

dotenv.config();

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3001"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(express.json());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/canvases", canvasRoutes); // Keep for backward compatibility
app.use("/api/memories", memoryRoutes);
app.use("/api/memories", memoryRoutesDetailed);
app.use("/api/users", userRoutes); // Add this line

// Basic health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "API is running" });
});

// Test PostgreSQL connection and start server
pool.query("SELECT NOW()", (err) => {
  // Remove _result
  if (err) {
    console.error("❌ PostgreSQL connection error:", err);
    process.exit(1);
  }
  console.log("✅ Connected to PostgreSQL at:", process.env.DB_HOST);

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });
});
