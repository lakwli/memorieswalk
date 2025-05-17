# Multi-stage build for MemoriesWalk application
FROM node:18-slim AS frontend-builder
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy frontend source code and build it
COPY src/ ./src/
COPY index.html ./
COPY *.js *.json ./

# Build the frontend - ensure it succeeds
RUN npm run build && echo "Frontend build completed successfully!"

# Verify the build output exists
RUN ls -la dist || (echo "ERROR: Frontend build failed - dist directory not created" && exit 1)

# Stage 2: Setup server with frontend files
FROM node:18-slim
WORKDIR /app

# Install PostgreSQL client for database initialization
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set up the server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --production

# Copy server files
COPY server/ ./

# Copy the built frontend from the first stage to the public directory
COPY --from=frontend-builder /app/dist /app/public

# Create and set permissions for file storage directory
RUN mkdir -p file_storage && chmod 777 file_storage

# Copy database directory
COPY database/ /app/database/

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port
EXPOSE 3000

# Start the server - use the index.js entry point
CMD ["node", "index.js"]
