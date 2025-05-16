import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import process from "process";
import pool from "./db.js";
import authRoutes from "./routes/auth.js";
// import canvasRoutes from "./routes/canvas.js"; // To be removed or refactored
import memoryRoutes from "./routes/memory.js"; // This is the main refactored route
// import memoryRoutesDetailed from "./routes/memoryRoutes.js"; // Likely obsolete or merged into memoryRoutes
import userRoutes from "./routes/userRoutes.js"; // Add this line
import errorHandler from "./middleware/errorHandler.js"; // Import ES Module error handler

import serveStatic from "serve-static"; // Added for static file serving
import path from "path"; // Added for path manipulation
import { fileURLToPath } from "url"; // Added to get __dirname in ES modules

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

app.use(express.json({ limit: "10mb" })); // Increased limit for potential base64 or large JSON payloads, adjust as needed

// Static file serving from public directory (for photos, etc.)
// The path stored in DB for photos is relative to `public` e.g. `photos/ab/abcdef.webp`
// So, `/media/photos/ab/abcdef.webp` will serve `/workspace/server/public/photos/ab/abcdef.webp`
const publicPath = path.join(__dirname, "public");
app.use(
  "/media", // Changed from /uploads to /media for a more general name
  serveStatic(publicPath, {
    maxAge: "1d", // Cache for 1 day
  })
);

// API routes
app.use("/api/auth", authRoutes);
// app.use("/api/canvases", canvasRoutes); // Remove or refactor if canvas logic is now part of memory views
app.use("/api/memories", memoryRoutes); // Main route for memories, photos, and views
// app.use("/api/memories", memoryRoutesDetailed); // Remove if functionality merged
app.use("/api/users", userRoutes); // Add this line

// Basic health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "API is running" });
});

// Add error handling middleware - MUST be after all routes and other app.use calls
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
