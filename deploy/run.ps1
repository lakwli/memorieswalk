# MemoriesWalk Deployment Script (PowerShell)
# This script handles the complete deployment of MemoriesWalk to a production server.
# It manages Docker containers, data persistence, and networking.

# Configuration variables
$GITHUB_REPO = "lakwli/memorieswalk"
$IMAGE_NAME = "ghcr.io/$GITHUB_REPO:latest"

# Function to execute Docker commands and handle errors
function Invoke-DockerCommand {
    param (
        [string]$Command
    )
    Write-Host "Executing: $Command"
    $Output = docker $Command
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Docker command failed: $Command"
        Write-Error $Output
        throw "Docker command failed"
    }
    return $Output
}

# Print banner
Write-Host "====================================" -ForegroundColor Green
Write-Host "    MemoriesWalk Deployment Tool    " -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

# Pull the latest Docker image
Write-Host "Pulling the latest Docker image..." -ForegroundColor Yellow
Invoke-DockerCommand "pull $IMAGE_NAME"

# Stop and remove existing containers
Write-Host "Stopping and removing existing containers..." -ForegroundColor Yellow
Invoke-DockerCommand "compose down"

# Start the containers using Docker Compose
Write-Host "Starting the containers using Docker Compose..." -ForegroundColor Yellow
Invoke-DockerCommand "compose up -d"

Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now access the application at:" -ForegroundColor Green
Write-Host "http://your-server-ip:3000"
Write-Host "If you're using a domain name, access it at: http://your-domain:3000" -ForegroundColor Yellow
Write-Host "Note: In production, both frontend and backend are served from port 3000" -ForegroundColor Green
