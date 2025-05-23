#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Stopping all running containers...${NC}"
docker stop $(docker ps -aq) 2>/dev/null || echo -e "${RED}No containers to stop${NC}"

echo -e "${YELLOW}Removing all containers...${NC}"
docker rm $(docker ps -aq) 2>/dev/null || echo -e "${RED}No containers to remove${NC}"

echo -e "${YELLOW}Current images:${NC}"
docker images

echo -e "${YELLOW}Do you want to remove all Docker images? (y/n)${NC}"
read -r REMOVE_IMAGES

if [[ "$REMOVE_IMAGES" == "y" ]]; then
  echo -e "${YELLOW}Removing all images...${NC}"
  docker rmi $(docker images -q) 2>/dev/null || echo -e "${RED}No images to remove${NC}"
else
  echo -e "${GREEN}Skipping image removal.${NC}"
fi

echo -e "${YELLOW}Current volumes:${NC}"
docker volume ls

echo -e "${YELLOW}Do you want to remove all Docker volumes? (y/n)${NC}"
read -r REMOVE_VOLUMES

if [[ "$REMOVE_VOLUMES" == "y" ]]; then
  echo -e "${YELLOW}Removing all volumes...${NC}"
  docker volume rm $(docker volume ls -q) 2>/dev/null || echo -e "${RED}No volumes to remove${NC}"
else
  echo -e "${GREEN}Skipping volume removal.${NC}"
fi

echo -e "${YELLOW}Current networks:${NC}"
docker network ls

echo -e "${YELLOW}Do you want to remove all custom Docker networks? (y/n)${NC}"
read -r REMOVE_NETWORKS

if [[ "$REMOVE_NETWORKS" == "y" ]]; then
  echo -e "${YELLOW}Removing all custom networks...${NC}"
  # Filter out default networks
  docker network rm $(docker network ls -q --filter="name=memorieswalk") 2>/dev/null || echo -e "${RED}No networks to remove${NC}"
else
  echo -e "${GREEN}Skipping network removal.${NC}"
fi

echo -e "${GREEN}Docker cleanup completed!${NC}"
echo -e "${GREEN}You can now rebuild your Docker images.${NC}"
