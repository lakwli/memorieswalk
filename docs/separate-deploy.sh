#!/bin/bash

# MemoriesWalk Separate Deployment Script
# This script handles deployment of MemoriesWalk with separate frontend and backend containers
# It manages Docker containers, data persistence, and networking.

# Exit on any error
set -e

# Configuration variables - CUSTOMIZE THESE
GITHUB_REPO="lakwli/memorieswalk"  # Fixed for this project
BACKEND_IMAGE_NAME="ghcr.io/$GITHUB_REPO:backend-latest"
FRONTEND_IMAGE_NAME="ghcr.io/$GITHUB_REPO:frontend-latest"
BACKEND_CONTAINER_NAME="memorieswalk-backend-prod"
FRONTEND_CONTAINER_NAME="memorieswalk-frontend-prod"
POSTGRES_CONTAINER_NAME="memorieswalk-postgres-prod"

# Directory paths on the host
HOST_DATA_DIR="/opt/memorieswalk/data/file_storage"
HOST_ENV_DIR="/opt/memorieswalk/env"
HOST_DB_DIR="/opt/memorieswalk/data/postgres"

# Port configuration
BACKEND_PORT=3000
FRONTEND_PORT=3001

# Color output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print banner
echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}  MemoriesWalk Separate Deployment  ${NC}"
echo -e "${GREEN}====================================${NC}"
echo ""

# Create directories if they don't exist
echo -e "${YELLOW}Setting up directory structure...${NC}"
mkdir -p $HOST_DATA_DIR
mkdir -p $HOST_ENV_DIR
mkdir -p $HOST_DB_DIR

# Check for environment files and create them if they don't exist
if [ ! -f "$HOST_ENV_DIR/server.env" ]; then
    echo -e "${YELLOW}server.env file not found. Creating template file...${NC}"
    # Create a template server.env file
    cat > "$HOST_ENV_DIR/server.env" << 'EOF'
DB_USER=node
DB_HOST=postgres
DB_NAME=memorieswalk
DB_PASSWORD=node
DB_PORT=5432
JWT_SECRET=change_this_to_a_secure_random_string
PORT=3000
NODE_ENV=production
FRONTEND_URL=http://localhost:3001
# Note: This deployment uses separate containers for frontend and backend
EOF
    echo -e "${GREEN}Created server.env template at $HOST_ENV_DIR/server.env${NC}"
    echo -e "${YELLOW}Please edit this file with your actual settings before continuing.${NC}"
    echo -e "${YELLOW}Press Enter to continue after editing the file, or Ctrl+C to exit...${NC}"
    read -p ""
fi

if [ ! -f "$HOST_ENV_DIR/frontend.env" ]; then
    echo -e "${YELLOW}frontend.env file not found. Creating template file...${NC}"
    # Create a template frontend.env file 
    cat > "$HOST_ENV_DIR/frontend.env" << 'EOF'
VITE_API_URL=http://localhost:3000/api
# Note: This deployment uses separate containers for frontend and backend
EOF
    echo -e "${GREEN}Created frontend.env template at $HOST_ENV_DIR/frontend.env${NC}"
    echo -e "${YELLOW}Please edit this file with your actual settings before continuing.${NC}"
    echo -e "${YELLOW}Press Enter to continue after editing the file, or Ctrl+C to exit...${NC}"
    read -p ""
fi

# Create Docker network if it doesn't exist
if ! docker network ls | grep -q memorieswalk-network; then
    echo -e "${YELLOW}Creating Docker network: memorieswalk-network${NC}"
    docker network create memorieswalk-network
else
    echo -e "${YELLOW}Docker network memorieswalk-network already exists${NC}"
fi

# Pull the latest Docker images
echo -e "${YELLOW}Pulling the latest Docker images...${NC}"
docker pull $BACKEND_IMAGE_NAME
docker pull $FRONTEND_IMAGE_NAME

# Stop and remove existing containers if they exist
echo -e "${YELLOW}Stopping and removing existing containers if they exist...${NC}"
docker stop $BACKEND_CONTAINER_NAME 2>/dev/null || true
docker rm $BACKEND_CONTAINER_NAME 2>/dev/null || true
docker stop $FRONTEND_CONTAINER_NAME 2>/dev/null || true
docker rm $FRONTEND_CONTAINER_NAME 2>/dev/null || true

# Load database credentials from server.env
echo -e "${YELLOW}Loading database credentials from server.env...${NC}"
if [ -f "$HOST_ENV_DIR/server.env" ]; then
    # Source the environment variables to make them available in this script
    source "$HOST_ENV_DIR/server.env"
    
    # Verify we have the required variables
    if [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
        echo -e "${YELLOW}WARNING: Missing database credentials in server.env. Using defaults.${NC}"
        DB_USER="node"
        DB_PASSWORD="node"
        DB_NAME="memorieswalk"
    else
        echo -e "${GREEN}Successfully loaded database credentials from server.env${NC}"
    fi
else
    echo -e "${YELLOW}WARNING: server.env not found. Using default database credentials.${NC}"
    DB_USER="node"
    DB_PASSWORD="node"
    DB_NAME="memorieswalk"
fi

# Check if postgres container is running, if not, start it
if ! docker ps -q -f name=$POSTGRES_CONTAINER_NAME | grep -q .; then
    echo -e "${YELLOW}Starting PostgreSQL container...${NC}"
    docker stop $POSTGRES_CONTAINER_NAME 2>/dev/null || true
    docker rm $POSTGRES_CONTAINER_NAME 2>/dev/null || true
    
    docker run -d \
        --name $POSTGRES_CONTAINER_NAME \
        --restart always \
        -e POSTGRES_USER="$DB_USER" \
        -e POSTGRES_PASSWORD="$DB_PASSWORD" \
        -e POSTGRES_DB="$DB_NAME" \
        -v $HOST_DB_DIR:/var/lib/postgresql/data \
        --network memorieswalk-network \
        -p 5432:5432 \
        postgres:latest
    
    echo -e "${YELLOW}Waiting for PostgreSQL to initialize...${NC}"
    sleep 10
    echo -e "${GREEN}PostgreSQL container started successfully with user '$DB_USER' and database '$DB_NAME'${NC}"
else
    echo -e "${YELLOW}PostgreSQL container already running${NC}"
fi

# Start the backend container
echo -e "${YELLOW}Starting the backend container...${NC}"
docker run -d \
    --name $BACKEND_CONTAINER_NAME \
    --restart always \
    --network memorieswalk-network \
    -p ${BACKEND_PORT}:3000 \
    -v $HOST_DATA_DIR:/app/file_storage \
    --env-file $HOST_ENV_DIR/server.env \
    $BACKEND_IMAGE_NAME

# Start the frontend container
echo -e "${YELLOW}Starting the frontend container...${NC}"
docker run -d \
    --name $FRONTEND_CONTAINER_NAME \
    --restart always \
    --network memorieswalk-network \
    -p ${FRONTEND_PORT}:80 \
    --env-file $HOST_ENV_DIR/frontend.env \
    $FRONTEND_IMAGE_NAME

# Check if database initialization is needed
SCHEMA_FILE="/opt/memorieswalk/schema.sql"
NEED_DB_INIT=false

# Wait a moment for containers to fully start
sleep 5

# Check if this is the first deployment by checking if the database tables exist
echo -e "${YELLOW}Checking if database initialization is needed...${NC}"
DB_TABLE_COUNT=$(docker exec -i $POSTGRES_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')

if [ "$DB_TABLE_COUNT" -lt 5 ]; then
    echo -e "${YELLOW}This appears to be a fresh installation. Database initialization is needed.${NC}"
    NEED_DB_INIT=true
    
    # Copy schema.sql to the host if it doesn't exist
    if [ ! -f "$SCHEMA_FILE" ]; then
        echo -e "${YELLOW}Copying schema.sql from backend container...${NC}"
        docker cp $BACKEND_CONTAINER_NAME:/app/database/schema.sql $SCHEMA_FILE
        
        if [ ! -f "$SCHEMA_FILE" ]; then
            echo -e "${RED}Warning: Could not find schema.sql in the container${NC}"
            echo -e "${YELLOW}Continuing anyway. You may need to initialize the database manually.${NC}"
            NEED_DB_INIT=false
        fi
    fi
    
    # Initialize the database if needed and if we have the schema file
    if [ "$NEED_DB_INIT" = true ] && [ -f "$SCHEMA_FILE" ]; then
        echo -e "${YELLOW}Initializing database with schema...${NC}"
        cat $SCHEMA_FILE | docker exec -i $POSTGRES_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME
        echo -e "${GREEN}Database initialization completed successfully!${NC}"
    fi
else
    echo -e "${GREEN}Database is already initialized. Skipping initialization.${NC}"
fi

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo ""
echo -e "${GREEN}You can now access the application at:${NC}"
echo -e "${GREEN}Frontend: http://your-server-ip:${FRONTEND_PORT}${NC}"
echo -e "${GREEN}Backend API: http://your-server-ip:${BACKEND_PORT}/api${NC}"
echo -e "${YELLOW}If you're using a domain name, replace 'your-server-ip' with your domain${NC}"
echo -e "${YELLOW}If you want to use different ports, edit the FRONTEND_PORT and BACKEND_PORT variables at the top of this script${NC}"
