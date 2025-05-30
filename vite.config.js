import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "", // This enables relative paths
  server: {
    host: true,
    port: 3001,
    watch: {
      usePolling: true,
    },
    // Show errors in terminal
    hmr: {
      overlay: true,
    },
  },
  build: {
    // Source maps for better error tracking
    sourcemap: true,
  },
  // Log more details during development
  logLevel: "info",
});
