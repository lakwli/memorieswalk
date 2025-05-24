import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import process from "process";
import pool from "./db.js";
import authRoutes from "./routes/auth.js";
import memoryRoutes from "./routes/memory.js";
import userRoutes from "./routes/userRoutes.js";
import publicShareRoutes from "./routes/publicShareRoutes.js";
import photoRoutes from "./routes/photos.js";
import errorHandler from "./middleware/errorHandler.js";
import { initializeSchedulers } from "./schedulers/index.js";
import { ensureDirectoriesExist } from "./utils/fileUtils.js";
import { FILE_STORAGE_CONFIG } from "./config.js";

import serveStatic from "serve-static";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure required application directories exist
const appDirectories = [
  FILE_STORAGE_CONFIG.TEMP_PHOTOS_DIR,
  FILE_STORAGE_CONFIG.PERMANENT_PHOTOS_DIR,
  path.join(__dirname, "public"),
];
ensureDirectoriesExist(appDirectories);

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean); // Remove empty strings

  app.use((req, res, next) => {
  const origin = req.headers.origin;
  const host = req.headers.host;

  const isSameOrigin = origin && origin.includes(host);
  const isWhitelisted = origin && allowedOrigins.includes(origin);

  if (!origin || isSameOrigin || isWhitelisted) {
    return cors({
      origin: origin || true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    })(req, res, next);
  } else {
    return res.status(403).json({ message: "Blocked by CORS" });
  }
});


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
app.use("/api/public", publicShareRoutes);
app.use("/api/photos", photoRoutes);

// API health check endpoint
app.get("/api", (req, res) => {
  res.json({ status: "API is running" });
});

// In production, serve frontend static files
if (process.env.NODE_ENV === "production") {
  console.log("Running in production mode - serving frontend files");
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
      endpoints: [
        "/api",
        "/api/auth",
        "/api/memories",
        "/api/users",
        "/api/public",
        "/api/photos",
      ],
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
    // Try to use the primary port, fall back to alternative if in use
    const primaryPort = process.env.PORT || 3000;
    const fallbackPorts = [3001, 3002, 3003, 3004, 3005];
    // Create server but don't start listening yet
    const server = app
      .listen(primaryPort)
      .on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.log(
            `⚠️ Port ${primaryPort} is already in use, trying alternative ports...`
          );

          // Close the server completely to prevent it from continuing
          server.close();

          // Try alternative ports sequentially
          let portIndex = 0;
          const tryNextPort = () => {
            if (portIndex >= fallbackPorts.length) {
              console.error(
                "❌ All ports are in use. Please free up a port or specify a different port in .env file."
              );
              process.exit(1);
            }
            const alternativePort = fallbackPorts[portIndex++];
            console.log(`Trying port ${alternativePort}...`);

            // Create a new server instance instead of reusing the old one
            const newServer = app
              .listen(alternativePort)
              .on("error", (err) => {
                if (err.code === "EADDRINUSE") {
                  console.log(`⚠️ Port ${alternativePort} is also in use.`);
                  // Make sure to close this server before trying the next port
                  newServer.close();
                  tryNextPort();
                } else {
                  console.error("❌ Server error:", err);
                  process.exit(1);
                }
              })
              .on("listening", () => {
                console.log(
                  `🚀 Server running on alternative port ${alternativePort}`
                );
                // Initialize schedulers after server has started
                initializeSchedulers();

                // Set up graceful shutdown for this new server instance
                setupGracefulShutdown(newServer);
              });
          };

          tryNextPort();
        } else {
          console.error("❌ Server error:", err);
          process.exit(1);
        }
      })
      .on("listening", () => {
        console.log(`🚀 Server running on port ${primaryPort}`);
        // Initialize schedulers after server has started
        initializeSchedulers();

        // Set up graceful shutdown for the primary server
        setupGracefulShutdown(server);
      }); // Function to set up graceful shutdown
    function setupGracefulShutdown(serverInstance) {
      // Set up graceful shutdown
      const gracefulShutdown = async () => {
        console.log("Graceful shutdown initiated...");

        // Stop the schedulers first to prevent new operations
        try {
          const { shutdownSchedulers } = await import("./schedulers/index.js");
          if (shutdownSchedulers) {
            await shutdownSchedulers();
            console.log("Schedulers shut down successfully");
          }
        } catch (err) {
          console.error("Error shutting down schedulers:", err);
        }

        // Now close the server
        serverInstance.close(async () => {
          console.log("HTTP server closed");
          console.log("All resources released, shutting down..."); // Force-close any remaining connections
          process._getActiveHandles().forEach((handle) => {
            if (handle && typeof handle.close === "function") {
              try {
                handle.close();
              } catch {
                // Ignore errors on close
              }
            }
          });

          // Exit process with a small delay to ensure socket cleanup
          setTimeout(() => {
            process.exit(0);
          }, 100);
        });

        // If server doesn't close within 5 seconds, force exit
        setTimeout(() => {
          console.log("Forcing process exit after timeout");
          process.exit(1);
        }, 5000);
      };

      // Listen for termination signals
      process.on("SIGTERM", gracefulShutdown);
      process.on("SIGINT", gracefulShutdown);
    }
  });
}

export default app;
