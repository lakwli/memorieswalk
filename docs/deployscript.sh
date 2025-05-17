#!/bin/bash

# Variables
IMAGE_NAME="ghcr.io/lakwli/memorieswalk:latest"
CONTAINER_NAME="memorieswalk"
PORT_MAPPING="3001:3001"
REGISTRY="ghcr.io"

# Step 1: Clean up old containers and images
echo "Cleaning up old containers and images..."
# Stop and remove all containers using the old image
docker ps -a --filter "ancestor=$IMAGE_NAME" --format "{{.Names}}" | xargs -r docker rm -f

# Remove the old image
docker rmi -f $IMAGE_NAME || true

# Step 3: Pull the latest Docker image
echo "Pulling the latest image from $IMAGE_NAME..."
docker pull $IMAGE_NAME

# Check if the pull was successful
if [ $? -ne 0 ]; then
  echo "Failed to pull the Docker image. Exiting."
  exit 1
fi

# Step 4: Run the new container
echo "Starting a new container ($CONTAINER_NAME)..."
docker run -d --name $CONTAINER_NAME -p $PORT_MAPPING $IMAGE_NAME

# Check if the container started successfully
if [ $? -eq 0 ]; then
  echo "New container started successfully!"
else
  echo "Failed to start the container. Exiting."
  exit 1
fi