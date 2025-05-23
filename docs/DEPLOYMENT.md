# MemoriesWalk Deployment Guide

This document provides step-by-step instructions for deploying the MemoriesWalk application using Docker on a production server.

## Prerequisites

- Ubuntu server with Docker installed
- Basic knowledge of Linux commands

> **Note:** Since this is an open-source project with a publicly accessible Docker image, no authentication is required to pull the image from GitHub Container Registry.

## Deployment Process

### 1. Deploy the Application

1. Copy the `deploy.sh` script to your production server:

   ```bash
   scp docs/deploy.sh user@your-server:/opt/memorieswalk/
   ```

2. Make it executable:

   ```bash
   ssh user@your-server "chmod +x /opt/memorieswalk/deploy.sh"
   ```

3. Run the deployment script:

   ```bash
   ssh user@your-server "/opt/memorieswalk/deploy.sh"
   ```

   > **Note:** The script is pre-configured to use the repository `lakwli/memorieswalk`.

### 2. Environment Configuration (Optional)

The deployment script automatically creates environment files with default values in `/opt/memorieswalk/env/` if they don't exist. However, you can customize these files before running the script:

1. Create server environment file at `/opt/memorieswalk/env/server.env`:

   ```bash
   mkdir -p /opt/memorieswalk/env/
   nano /opt/memorieswalk/env/server.env
   ```

   For reference, see the example server environment file:
   https://github.com/lakwli/memorieswalk/blob/main/server/.env.example

2. Create frontend environment file at `/opt/memorieswalk/env/frontend.env`:

   ```bash
   nano /opt/memorieswalk/env/frontend.env
   ```

   For reference, see the example frontend environment file:
   https://github.com/lakwli/memorieswalk/blob/main/src/.env.example

> **Note:** For most deployments, the default environment values created by the script will work without modification. Custom values are only needed for special deployment scenarios.

## The All-in-One Deployment Script

The `deploy.sh` script handles everything automatically:

### Directory Creation

- Creates necessary directories for data persistence
- Creates environment files with templates if they don't exist

### Environment Configuration

- Prompts for editing environment files when first created
- Uses environment variables to configure both application and database

### Container Management

- Creates Docker network if needed
- Sets up PostgreSQL container with proper configuration
- Deploys the application container with appropriate settings
- Ensures proper container connectivity

### Data Persistence

- Mounts volumes for database persistence at `/opt/memorieswalk/data/postgres`
- Preserves uploaded photos at `/opt/memorieswalk/data/file_storage`

### Database Initialization

- Automatically detects if this is a first-time deployment
- Extracts database schema from the application container
- Applies the schema to the database when needed
- Skips initialization for subsequent deployments

## Updating the Application

To update the application after pushing changes to GitHub:

```bash
ssh user@your-server "/opt/memorieswalk/deploy.sh"
```

Simply running the deploy.sh script again will pull the latest image and update everything while preserving all data.
