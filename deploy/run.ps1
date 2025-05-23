# MemoriesWalk Deployment Script (PowerShell)
# This script handles the complete deployment of MemoriesWalk to a production server.
# It manages Docker containers, data persistence, and networking.

# Configuration variables
$IMAGE_NAME = "ghcr.io/lakwli/memorieswalk:app"

# Function to execute Docker commands and handle errors
function Invoke-DockerCommand {
    param (
        [string]$Command
    )
    Write-Host "Executing: docker $Command"
    
    # Split command string into array for correct execution
    $args = $Command -split ' '
    $Output = & docker @args

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
$composePath = Join-Path $PSScriptRoot "docker-compose.yml"
Write-Host "Using docker-compose file: $composePath" -ForegroundColor Yellow

try {
    Invoke-DockerCommand "compose -f `"$composePath`" down"
} catch {
    Write-Warning "No existing containers found or error stopping them. Continuing..."
}

# Start the database container first
Write-Host "Starting the database container..." -ForegroundColor Yellow
Invoke-DockerCommand "compose -f `"$composePath`" up -d db"

# Wait for the database to be ready
Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Start the app container
Write-Host "Starting the application container..." -ForegroundColor Yellow
Invoke-DockerCommand "compose -f `"$composePath`" up -d app"

Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now access the application at:" -ForegroundColor Green
Write-Host "http://your-server-ip:3000"
Write-Host "If you're using a domain name, access it at: http://your-domain:3000" -ForegroundColor Yellow
Write-Host "Note: In production, both frontend and backend are served from port 3000" -ForegroundColor Green
