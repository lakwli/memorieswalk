FROM node:22-slim as frontend-builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-slim

# Create app directory
WORKDIR /app

# Install required packages
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN groupadd -r appuser && useradd -r -g appuser -m appuser

# Copy backend files
COPY --chown=appuser:appuser server/package*.json ./server/
WORKDIR /app/server
RUN npm install --production --legacy-peer-deps

WORKDIR /app
COPY --chown=appuser:appuser server ./server

# Copy built frontend files from the build stage
COPY --from=frontend-builder --chown=appuser:appuser /app/dist ./dist

# Create directories for persistent data
RUN mkdir -p /app/server/file_storage && chown -R appuser:appuser /app/server/file_storage

# Switch to non-root user
USER appuser

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "server/index.js"]
