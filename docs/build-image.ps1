# MemoriesWalk - Build Docker Image Script for Windows
# This script builds the Docker image locally

# Stop script on first error
$ErrorActionPreference = "Stop"

# Configuration variables
$IMAGE_NAME = "memorieswalk:latest"

# Print banner
Write-Host "====================================" -ForegroundColor Green
Write-Host "    MemoriesWalk Image Builder      " -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

# Build the Docker image
Write-Host "Building Docker image..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Yellow

# Set BuildKit for better performance
$env:DOCKER_BUILDKIT = 1

# Build the image
docker build -t $IMAGE_NAME .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error building Docker image. Check the errors above." -ForegroundColor Red
    exit 1
}

Write-Host "Docker image built successfully!" -ForegroundColor Green
Write-Host "Image name: $IMAGE_NAME" -ForegroundColor Green
Write-Host ""
Write-Host "You can now deploy the application using deploy.ps1" -ForegroundColor Green
