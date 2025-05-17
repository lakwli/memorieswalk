#!/bin/bash

# MemoriesWalk Deployment Script
# This script handles the complete deployment of MemoriesWalk to a production server.
# It manages Docker containers, data persistence, and networking.
# 
# Simply run this script on your production server to deploy or update the application.

# Exit on any error
set -e

# Configuration variables - CUSTOMIZE THESE
GITHUB_REPO="lakwli/memorieswalk"  # Fixed for this project
IMAGE_NAME="ghcr.io/$GITHUB_REPO:latest"
CONTAINER_NAME="memorieswalk-prod"
POSTGRES_CONTAINER_NAME="memorieswalk-postgres-prod"

# Directory paths on the host
HOST_DATA_DIR="/opt/memorieswalk/data/file_storage"
HOST_ENV_DIR="/opt/memorieswalk/env"
HOST_DB_DIR="/opt/memorieswalk/data/postgres"

# Color output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print banner
echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}    MemoriesWalk Deployment Tool    ${NC}"
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
FRONTEND_URL=/
# Note: In production, frontend and backend are served from the same container
EOF
    echo -e "${GREEN}Created server.env template at $HOST_ENV_DIR/server.env${NC}"
    echo -e "${YELLOW}Please edit this file with your actual settings before continuing.${NC}"
    echo -e "${YELLOW}Press Enter to continue after editing the file, or Ctrl+C to exit...${NC}"
    read -p ""
fi

if [ ! -f "$HOST_ENV_DIR/frontend.env" ]; then
    echo -e "${YELLOW}frontend.env file not found. Creating template file...${NC}"
    # Create a template frontend.env file - these variables were used during the frontend build process
    # in the Docker image creation and need to be provided here for completeness
    cat > "$HOST_ENV_DIR/frontend.env" << 'EOF'
VITE_API_URL=/api
# Note: In production, API calls are relative to the same domain
# This is different from development where frontend uses port 3001 and backend uses port 3000
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

# Pull the latest Docker image
echo -e "${YELLOW}Pulling the latest Docker image...${NC}"
docker pull $IMAGE_NAME

# Stop and remove existing app container if it exists
echo -e "${YELLOW}Stopping and removing existing app container if it exists...${NC}"
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

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
        --network-alias postgres \
        -p 5432:5432 \
        postgres:latest
    
    echo -e "${YELLOW}Waiting for PostgreSQL to initialize...${NC}"
    sleep 10
    echo -e "${GREEN}PostgreSQL container started successfully with user '$DB_USER' and database '$DB_NAME'${NC}"
else
    echo -e "${YELLOW}PostgreSQL container already running${NC}"
    
    # Make sure the container is on the right network with the alias
    if ! docker network inspect memorieswalk-network | grep -q "\"$POSTGRES_CONTAINER_NAME\""; then
        echo -e "${YELLOW}Reconnecting PostgreSQL container to memorieswalk-network...${NC}"
        docker network connect --alias postgres memorieswalk-network $POSTGRES_CONTAINER_NAME
    fi
fi

# Start the application container (which runs backend server but also serves frontend files)
echo -e "${YELLOW}Starting the application container...${NC}"
docker run -d \
    --name $CONTAINER_NAME \
    --restart always \
    --network memorieswalk-network \
    -p 3000:3000 \
    -v $HOST_DATA_DIR:/app/server/file_storage \
    --env-file $HOST_ENV_DIR/server.env \
    --env-file $HOST_ENV_DIR/frontend.env \
    $IMAGE_NAME

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
        echo -e "${YELLOW}Copying schema.sql from application container...${NC}"
        docker cp $CONTAINER_NAME:/app/database/schema.sql $SCHEMA_FILE
        
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
echo -e "http://your-server-ip:3000"
echo -e "${YELLOW}If you're using a domain name, access it at: http://your-domain:3000${NC}"
echo -e "${GREEN}Note: In production, both frontend and backend are served from port 3000${NC}"
