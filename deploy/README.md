# Memories Walk - Local Deployment Guide

This document provides instructions for deploying the Memories Walk application on your local environment.

## Prerequisites

- Docker and Docker Compose installed
- Git (for ARM64 deployment)

## Deployment Steps

1. Copy files from the `deploy` folder to your local deployment directory:
   - `docker-compose.yml`
   - Choose the appropriate script for your platform:
     - `run.ps1` for Windows
     - `run-arm64` for ARM-based systems
     - `run.sh` for other systems (Linux/macOS)

2. **Important**: Update the JWT secret in `docker-compose.yml`:
   ```yaml
   environment:
     JWT_SECRET: your_secure_random_string_here
   ```

3. Run the appropriate script for your platform:
   - Windows: `.\run.ps1`
   - ARM64: `./run-arm64`
   - Linux/macOS: `./run.sh`

## Environment Configuration

You can configure the application in two ways:

### Option 1: Environment Variables in docker-compose.yml

Add environment variables directly to the `app` service in `docker-compose.yml`:

```yaml
services:
  app:
    image: ghcr.io/lakwli/memorieswalk:app
    environment:
      JWT_SECRET: your_secure_random_string_here
      DATABASE_URL: postgres://username:password@db:5432/dbname
      # Add other environment variables as needed
```

### Option 2: Using an .env File

Create an `.env` file and add it to the volumes section in `docker-compose.yml`:

```yaml
services:
  app:
    volumes:
      - memorieswalk_data:/app/server/file_storage
      - ./your-env-file.env:/app/.env
```

Sample environment variables can be found in:
- `src/.env.example`
- `server/.env.example`

## Special Note for ARM64 Deployment

When using the `run-arm64` script on ARM-based systems, the script will:
1. Pull the source code repository
2. Build the application locally to ensure ARM64 compatibility
3. Deploy the containers

This ensures optimal performance on ARM architectures like Apple Silicon Macs or Raspberry Pi devices.

## Accessing the Application

Once deployed, the application will be available at:
- Web interface: `http://localhost:3000`
- Database: `localhost:5432` (if you need direct database access)

## Data Persistence

Your data will be stored in Docker volumes:
- `memorieswalk_data`: Application file storage
- `memorieswalk_db_data`: Database files
