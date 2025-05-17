import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import process from "process";
import pool from "./db.js";
import authRoutes from "./routes/auth.js";
import memoryRoutes from "./routes/memory.js";
import userRoutes from "./routes/userRoutes.js";
import publicShareRoutes from './routes/publicShareRoutes.js';
import errorHandler from "./middleware/errorHandler.js";

import serveStatic from "serve-static";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:5173",
      "http://localhost:3001",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(express.json({ limit: "10mb" }));

// Static file serving for media files (photos, etc.)
const publicPath = path.join(__dirname, "public");
app.use(
  "/media",
  serveStatic(publicPath, {
    maxAge: "1d",
  })
);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/memories", memoryRoutes);
app.use("/api/users", userRoutes);
app.use('/api/public', publicShareRoutes);

// API health check endpoint
app.get("/api", (req, res) => {
  res.json({ status: "API is running" });
});

// In production, serve frontend static files
if (process.env.NODE_ENV === 'production') {
  console.log('Running in production mode - serving frontend files');
  const frontendPath = path.join(__dirname, "..", "public");
  app.use(express.static(frontendPath));
  
  // Catch-all route for SPA frontend - must be after all other routes
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
} else {
  // In development, just return API info at the root
  app.get("/", (req, res) => {
    res.json({ 
      status: "API is running in development mode",
      message: "Connect your frontend application to the API endpoints",
      endpoints: ["/api", "/api/auth", "/api/memories", "/api/users", "/api/public"]
    });
  });
}

// Add error handling middleware - MUST be after all routes
app.use(errorHandler);

// Start server only if this file is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  pool.query("SELECT NOW()", (err) => {
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
}

export default app;
