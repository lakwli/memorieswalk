#!/bin/bash
# MemoriesWalk Deployment Script for AMD64
# This script deploys the MemoriesWalk application using pre-built Docker images for AMD64 systems.

# Configuration variables
APP_IMAGE="ghcr.io/lakwli/memorieswalk:app"
DB_IMAGE="ghcr.io/lakwli/memorieswalk:db"
COMPOSE_PATH="$(dirname "$(readlink -f "$0")")/docker-compose.yml"

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
echo -e "\e[32m    MemoriesWalk Deployment Tool (AMD64)    \e[0m"
echo -e "\e[32m====================================\e[0m"
echo ""

# Set environment variables for docker-compose
echo -e "\e[33mSetting environment variables for AMD64 images...\e[0m"
export APP_IMAGE=$APP_IMAGE
export DB_IMAGE=$DB_IMAGE

# Pull the latest Docker images
echo -e "\e[33mPulling the latest Docker images...\e[0m"
invoke_docker_command pull $APP_IMAGE
invoke_docker_command pull $DB_IMAGE

# Stop and remove existing containers
echo -e "\e[33mStopping and removing existing containers...\e[0m"
echo -e "\e[33mUsing docker-compose file: $COMPOSE_PATH\e[0m"
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