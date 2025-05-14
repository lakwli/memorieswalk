import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import pool from "./db.js";
import authRoutes from "./routes/auth.js";
import canvasRoutes from "./routes/canvas.js";

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
app.use("/api/canvases", canvasRoutes);

// Basic health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "API is running" });
});

// Test PostgreSQL connection and start server
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ PostgreSQL connection error:", err);
    process.exit(1);
  }
  console.log("✅ Connected to PostgreSQL at:", process.env.DB_HOST);

  app.listen(process.env.PORT || 3000, () => {
    console.log(`🚀 Server running on port ${process.env.PORT || 3000}`);
  });
});
