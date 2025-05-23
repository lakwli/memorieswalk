# MemoriesWalk Deployment Overview

This document explains the deployment process for MemoriesWalk and how the different components work together.

> **Note:** This project uses the publicly accessible Docker image from `ghcr.io/lakwli/memorieswalk` in GitHub Container Registry, so no authentication is required to pull the image.

## Deployment Approach

We use a simple shell script (`deploy.sh`) to handle the entire deployment process:

- Setting up required directories
- Creating the Docker network
- Pulling the latest Docker image from GitHub Container Registry
- Managing the PostgreSQL container with data persistence
- Setting up the application container with environment variables
- Mounting volumes for uploaded photo persistence

The script is designed to be run on your Ubuntu production server and will handle both initial deployment and subsequent updates.

## How The Components Work Together

1. **GitHub Actions** builds your Docker image when you push to the main branch.
2. The Docker image is published to GitHub Container Registry.
3. On your production server, the `deploy.sh` script:
   - Pulls the latest Docker image
   - Creates/manages the containers
   - Ensures data persistence
4. Persistent data is stored in:
   - `/opt/memorieswalk/data/file_storage` for uploaded photos
   - `/opt/memorieswalk/data/postgres` for database data
5. Environment variables are loaded from:
   - `/opt/memorieswalk/env/server.env` for backend configuration and PostgreSQL configuration
   - `/opt/memorieswalk/env/frontend.env` for frontend configuration

## Key Files and Their Purposes

- `.github/workflows/docker-publish.yml`: The GitHub Actions workflow that builds and publishes the Docker image
- `Dockerfile`: The Docker image definition for the production build
- `docs/deploy.sh`: The single deployment script that handles everything (containers, networking, and database initialization)
- `docs/DEPLOYMENT.md`: The main deployment instructions

## Environment Files Explained

Our application uses two environment files:

1. **server.env**: Contains backend configuration including database connection details (used by both the Node.js application and the PostgreSQL container)
2. **frontend.env**: Contains frontend configuration (used by the React/Vite frontend)

The `server.env` file uses variables with the `DB_*` prefix (DB_USER, DB_PASSWORD, etc.). Our deployment scripts automatically extract these values to configure the PostgreSQL container (which expects POSTGRES_USER, POSTGRES_PASSWORD, etc.). This approach ensures that database credentials are maintained in a single place, following the principle of having a single source of truth.

## Deployment Steps Simplified

1. **Deployment**:

   - Copy and run `deploy.sh` on your production server
   - The script handles everything else:
     - Docker network creation
     - Database container setup
     - Application container setup
     - Database initialization (if needed)

2. **For updates** (after code changes):
   - Simply run `deploy.sh` again
   - All data will persist across deployments
