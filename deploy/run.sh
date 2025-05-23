#!/bin/bash
# MemoriesWalk Deployment Script (Bash)
# This script handles the complete deployment of MemoriesWalk to a production server.
# It manages Docker containers, data persistence, and networking.

# Configuration variables
IMAGE_NAME="ghcr.io/lakwli/memorieswalk:app"

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
echo -e "\e[32m    MemoriesWalk Deployment Tool    \e[0m"
echo -e "\e[32m====================================\e[0m"
echo ""

# Pull the latest Docker image
echo -e "\e[33mPulling the latest Docker image...\e[0m"
invoke_docker_command pull $IMAGE_NAME

# Stop and remove existing containers
echo -e "\e[33mStopping and removing existing containers...\e[0m"
COMPOSE_PATH="$(dirname "$(readlink -f "$0")")/docker-compose.yml"
echo -e "\e[33mUsing docker-compose file: $COMPOSE_PATH\e[0m"

# Try to stop existing containers, but continue if it fails
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
