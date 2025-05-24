#!/bin/bash
# MemoriesWalk Deployment Script for ARM64
# This script clones the MemoriesWalk repository, builds Docker images for ARM64,
# updates docker-compose.yml to use local images, and deploys the application.
# Usage: ./run-arm64.sh

# Configuration variables
REPO_URL="https://github.com/lakwli/memorieswalk.git"
REPO_DIR="memorieswalk"
APP_IMAGE="memorieswalk:app"
DB_IMAGE="memorieswalk:db"
COMPOSE_PATH="../docker-compose.yml"

# Function to execute commands and handle errors
function invoke_command() {
    local command="$@"
    echo "Executing: $command"

    # Execute the command
    $command

    # Check if the command was successful
    if [ $? -ne 0 ]; then
        echo -e "\e[31mError: Command failed: $command\e[0m" >&2
        exit 1
    fi
}

# Function to execute Docker commands and handle errors
function invoke_docker_command() {
    local command="$@"
    echo "Executing: docker $command"

    # Execute the command
    docker $command

    # Check if the command was successful
    if [ $? -ne 0 ]; then
        echo -e "\e[31mError: Docker command failed: $command\e[0m" >&2
        exit 1
    fi
}

# Print banner
echo -e "\e[32m====================================\e[0m"
echo -e "\e[32m    MemoriesWalk Deployment Tool (ARM64)    \e[0m"
echo -e "\e[32m====================================\e[0m"
echo ""

# Validate dependencies
if ! command -v git &> /dev/null; then
    echo -e "\e[31mError: Git is not installed. Please install Git.\e[0m" >&2
    exit 1
fi

#remove directory
rm -rf memorieswalk

# Clone or update repository
if [ -d "$REPO_DIR" ]; then
    echo -e "\e[33mRepository exists. Pulling latest changes...\e[0m"
    invoke_command "cd $REPO_DIR && git pull"
else
    echo -e "\e[33mCloning repository...\e[0m"
    invoke_command "git clone $REPO_URL $REPO_DIR"
fi

invoke_command "cd $REPO_DIR"

# Build images for ARM64
invoke_docker_command build --no-cache -t "$APP_IMAGE" --platform linux/arm64 -f Dockerfile .
invoke_docker_command build --no-cache -t "$DB_IMAGE" --platform linux/arm64 -f db.Dockerfile .

# Update docker-compose.yml
echo -e "\e[33mUpdating docker-compose.yml...\e[0m"
echo "DEBUG: Running sed command:"
echo "sed -i 's|ghcr.io/lakwli/memorieswalk:app|${APP_IMAGE}|g' ${COMPOSE_PATH}"
sed -i 's|ghcr.io/lakwli/memorieswalk:app|memorieswalk:app|g' $COMPOSE_PATH
sed -i 's|ghcr.io/lakwli/memorieswalk:db|memorieswalk:db|g' $COMPOSE_PATH

# Stop and remove existing containers
if ! docker compose -f "$COMPOSE_PATH" down; then
    echo -e "\e[33mNo containers found or error stopping them.\e[0m"
fi

# Start containers
invoke_docker_command compose -f "$COMPOSE_PATH" up -d db
sleep 10
invoke_docker_command compose -f "$COMPOSE_PATH" up -d app

echo -e "\e[32mDeployment completed successfully!\e[0m"
echo "Access your app at: http://$(hostname -I | awk '{print $1}'):3000"