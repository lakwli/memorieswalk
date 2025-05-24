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
COMPOSE_PATH="$REPO_DIR/docker-compose.yml"

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

# Print banner with colors
echo -e "\e[32m====================================\e[0m"
echo -e "\e[32m    MemoriesWalk Deployment Tool (ARM64)    \e[0m"
echo -e "\e[32m====================================\e[0m"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "\e[31mError: Git is not installed. Please install Git and try again.\e[0m" >&2
    exit 1
fi

# Check if repository directory exists, if not, clone it
if [ -d "$REPO_DIR" ]; then
    echo -e "\e[33mRepository directory $REPO_DIR already exists. Pulling latest changes...\e[0m"
    invoke_command "cd $REPO_DIR && git pull"
else
    echo -e "\e[33mCloning MemoriesWalk repository...\e[0m"
    invoke_command "git clone $REPO_URL $REPO_DIR"
fi

# Change to the repository directory
invoke_command "cd $REPO_DIR"

# Build the app image for ARM64
echo -e "\e[33mBuilding the application image for ARM64: $APP_IMAGE\e[0m"
invoke_docker_command build -t "$APP_IMAGE" --platform linux/arm64 -f Dockerfile .

# Build the db image for ARM64
echo -e "\e[33mBuilding the database image for ARM64: $DB_IMAGE\e[0m"
invoke_docker_command build -t "$DB_IMAGE" --platform linux/arm64 -f db.Dockerfile .

# Update docker-compose.yml to use local images
echo -e "\e[33mUpdating docker-compose.yml to use local images...\e[0m"
invoke_command "sed -i 's|ghcr.io/lakwli/memorieswalk:app|$APP_IMAGE|' $COMPOSE_PATH"
invoke_command "sed -i 's|ghcr.io/lakwli/memorieswalk:db|$DB_IMAGE|' $COMPOSE_PATH"

# Stop and remove existing containers
echo -e "\e[33mStopping and removing existing containers...\e[0m"
if ! docker compose -f "$COMPOSE_PATH" down; then
    echo -e "\e[33mWarning: No existing containers found or error stopping them. Continuing...\e[0m"
fi

# Start the database container first
echo -e "\e[33mStarting the database container...\e[0m"
invoke_docker_command compose -f "$COMPOSE_PATH" up -d db

# Wait for the database to be ready
echo -e "\e[33mWaiting for database to be ready...\e[0m"
sleep 10

# Start the app container
echo -e "\e[33mStarting the application container...\e[0m"
invoke_docker_command compose -f "$COMPOSE_PATH" up -d app

echo -e "\e[32mDeployment completed successfully!\e[0m"
echo ""
echo -e "\e[32mYou can now access the application at:\e[0m"
echo "http://$(hostname -I | awk '{print $1}'):3000"
echo -e "\e[33mIf you're using a domain name, access it at: http://your-domain:3000\e[0m"
echo -e "\e[32mNote: In production, both frontend and backend are served from port 3000\e[0m"