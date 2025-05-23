1️⃣ Create a Cleanup Worker (Separate Node.js Script)
You need a separate script (cleanupWorker.js) to manage scheduled cleanup.
Example: cleanupWorker.js

const fs = require("fs");
const path = "./temp_folder";

// Function to remove files older than 1 day
function cleanupTempFiles() {
const files = fs.readdirSync(path);
const now = Date.now();

files.forEach(file => {
const filePath = `${path}/${file}`;
const stats = fs.statSync(filePath);
const age = now - stats.mtimeMs;

    if (age > 86400000) { // Delete files older than 1 day
      console.log(`Deleting old file: ${file}`);
      fs.unlinkSync(filePath);
    }

});
}

console.log("Cleanup Worker started...");

// Run cleanup every 24 hours
setInterval(cleanupTempFiles, 86400000);

// Handle container stop
process.on("SIGTERM", () => {
console.log("Cleanup Worker shutting down...");
process.exit(0);
});

2️⃣ Add Cleanup Worker to Docker
Create a separate Docker service for the cleanup worker in docker-compose.yml.
Example: docker-compose.yml

version: "3.8"
services:
app:
build: ./app
container_name: my_app
restart: always
ports: - "3000:3000"

cleanup_worker:
build: ./worker
container_name: cleanup_worker
restart: always
depends_on: - app

3️⃣ Build Cleanup Worker Docker Container
Create a separate folder /worker and add a Dockerfile.
Example: worker/Dockerfil

FROM node:18
WORKDIR /app
COPY cleanupWorker.js .
CMD ["node", "cleanupWorker.js"]

docker-compose up --build -d
