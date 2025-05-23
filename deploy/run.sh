#!/bin/bash
set -e

# Configuration variables
GITHUB_REPO="lakwli/memorieswalk"
IMAGE_NAME="ghcr.io/$GITHUB_REPO:latest"

# Color output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print banner
echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}    MemoriesWalk Deployment Tool    ${NC}"
echo -e "${GREEN}====================================${NC}"
echo ""

# Pull the latest Docker image
echo -e "${YELLOW}Pulling the latest Docker image...${NC}"
docker pull $IMAGE_NAME

# Stop and remove existing containers
echo -e "${YELLOW}Stopping and removing existing containers...${NC}"
docker compose down

# Start the containers using Docker Compose
echo -e "${YELLOW}Starting the containers using Docker Compose...${NC}"
docker compose up -d

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo ""
echo -e "${GREEN}You can now access the application at:${NC}"
echo -e "http://your-server-ip:3000"
echo -e "${YELLOW}If you're using a domain name, access it at: http://your-domain:3000${NC}"
echo -e "${GREEN}Note: In production, both frontend and backend are served from port 3000${NC}"
