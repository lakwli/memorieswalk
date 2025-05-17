# MemoriesWalk Deployment Script for Windows
# This script handles the complete deployment of MemoriesWalk to a Windows development environment.
# It manages Docker containers, data persistence, and networking.
# 
# Run this script in PowerShell to deploy or update the application locally.

# Stop script on first error
$ErrorActionPreference = "Stop"

# Configuration variables - CUSTOMIZE THESE
# $GITHUB_REPO = "lakwli/memorieswalk"  # Fixed for this project - commented out for local image
$IMAGE_NAME = "memorieswalk:latest"  # Using local image instead of GitHub Container Registry
$CONTAINER_NAME = "memorieswalk-prod"
$POSTGRES_CONTAINER_NAME = "memorieswalk-postgres-prod"

# Directory paths on the host - Adjust these for Windows paths
$BASE_DIR = "C:\memorieswalk"
$HOST_DATA_DIR = "$BASE_DIR\data\file_storage"
$HOST_ENV_DIR = "$BASE_DIR\env"
$HOST_DB_DIR = "$BASE_DIR\data\postgres"

# Print banner
Write-Host "====================================" -ForegroundColor Green
Write-Host "    MemoriesWalk Deployment Tool    " -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

# Create directories if they don't exist
Write-Host "Setting up directory structure..." -ForegroundColor Yellow
if (-not (Test-Path $HOST_DATA_DIR)) { New-Item -Path $HOST_DATA_DIR -ItemType Directory -Force | Out-Null }
if (-not (Test-Path $HOST_ENV_DIR)) { New-Item -Path $HOST_ENV_DIR -ItemType Directory -Force | Out-Null }
if (-not (Test-Path $HOST_DB_DIR)) { New-Item -Path $HOST_DB_DIR -ItemType Directory -Force | Out-Null }

# Check for environment files and create them if they don't exist
$SERVER_ENV_PATH = "$HOST_ENV_DIR\server.env"
if (-not (Test-Path $SERVER_ENV_PATH)) {
    Write-Host "server.env file not found. Creating template file..." -ForegroundColor Yellow
    # Create a template server.env file
    @"
DB_USER=node
DB_HOST=postgres
DB_NAME=memorieswalk
DB_PASSWORD=node
DB_PORT=5432
JWT_SECRET=change_this_to_a_secure_random_string
PORT=3000
NODE_ENV=production
FRONTEND_URL=/
# Note: In production, frontend and backend are served from the same container
"@ | Out-File -FilePath $SERVER_ENV_PATH -Encoding utf8 -NoNewline
    
    Write-Host "Created server.env template at $SERVER_ENV_PATH" -ForegroundColor Green
    Write-Host "Please edit this file with your actual settings before continuing." -ForegroundColor Yellow
    Write-Host "Press Enter to continue after editing the file, or Ctrl+C to exit..." -ForegroundColor Yellow
    Read-Host
}

$FRONTEND_ENV_PATH = "$HOST_ENV_DIR\frontend.env"
if (-not (Test-Path $FRONTEND_ENV_PATH)) {
    Write-Host "frontend.env file not found. Creating template file..." -ForegroundColor Yellow
    # Create a template frontend.env file
    @"
VITE_API_URL=/api
# Note: In production, API calls are relative to the same domain
# This is different from development where frontend uses port 3001 and backend uses port 3000
"@ | Out-File -FilePath $FRONTEND_ENV_PATH -Encoding utf8 -NoNewline
    
    Write-Host "Created frontend.env template at $FRONTEND_ENV_PATH" -ForegroundColor Green
    Write-Host "Please edit this file with your actual settings before continuing." -ForegroundColor Yellow
    Write-Host "Press Enter to continue after editing the file, or Ctrl+C to exit..." -ForegroundColor Yellow
    Read-Host
}

# Create Docker network if it doesn't exist
$networkExists = docker network ls | Select-String -Pattern "memorieswalk-network"
if (-not $networkExists) {
    Write-Host "Creating Docker network: memorieswalk-network" -ForegroundColor Yellow
    docker network create memorieswalk-network
}
else {
    Write-Host "Docker network memorieswalk-network already exists" -ForegroundColor Yellow
}

# Check if the local image exists
Write-Host "Checking for local Docker image..." -ForegroundColor Yellow
$imageExists = docker image ls $IMAGE_NAME --format "{{.Repository}}" | Select-String -Pattern $IMAGE_NAME -Quiet

if (-not $imageExists) {
    Write-Host "WARNING: Local image $IMAGE_NAME not found. Make sure you have built it with:" -ForegroundColor Red
    Write-Host "docker build -t $IMAGE_NAME ." -ForegroundColor Yellow
    Write-Host "Do you want to continue anyway? (y/n)" -ForegroundColor Yellow
    $continue = Read-Host
    if ($continue -ne "y") {
        Write-Host "Deployment aborted. Please build the image first." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Local image $IMAGE_NAME found!" -ForegroundColor Green
}

# Stop and remove existing app container if it exists
Write-Host "Stopping and removing existing app container if it exists..." -ForegroundColor Yellow
docker stop $CONTAINER_NAME 2>$null
docker rm $CONTAINER_NAME 2>$null

# Load database credentials from server.env
Write-Host "Loading database credentials from server.env..." -ForegroundColor Yellow
$DB_USER = "node"
$DB_PASSWORD = "node"
$DB_NAME = "memorieswalk"

if (Test-Path $SERVER_ENV_PATH) {
    # Parse the server.env file to extract database credentials
    $envContent = Get-Content $SERVER_ENV_PATH
    
    foreach ($line in $envContent) {
        if ($line -match "^DB_USER=(.*)$") {
            $DB_USER = $matches[1]
        }
        elseif ($line -match "^DB_PASSWORD=(.*)$") {
            $DB_PASSWORD = $matches[1]
        }
        elseif ($line -match "^DB_NAME=(.*)$") {
            $DB_NAME = $matches[1]
        }
    }
    
    # Verify we have the required variables
    if (-not $DB_USER -or -not $DB_PASSWORD -or -not $DB_NAME) {
        Write-Host "WARNING: Missing database credentials in server.env. Using defaults." -ForegroundColor Yellow
        $DB_USER = "node"
        $DB_PASSWORD = "node"
        $DB_NAME = "memorieswalk"
    }
    else {
        Write-Host "Successfully loaded database credentials from server.env" -ForegroundColor Green
    }
}
else {
    Write-Host "WARNING: server.env not found. Using default database credentials." -ForegroundColor Yellow
}

# Check if postgres container is running, if not, start it
$postgresRunning = docker ps -q -f name=$POSTGRES_CONTAINER_NAME
if (-not $postgresRunning) {
    Write-Host "Starting PostgreSQL container..." -ForegroundColor Yellow
    docker stop $POSTGRES_CONTAINER_NAME 2>$null
    docker rm $POSTGRES_CONTAINER_NAME 2>$null
    
    docker run -d `
        --name $POSTGRES_CONTAINER_NAME `
        --restart always `
        -e POSTGRES_USER="$DB_USER" `
        -e POSTGRES_PASSWORD="$DB_PASSWORD" `
        -e POSTGRES_DB="$DB_NAME" `
        -v "${HOST_DB_DIR}:/var/lib/postgresql/data" `
        --network memorieswalk-network `
        -p 5432:5432 `
        postgres:latest
    
    Write-Host "Waiting for PostgreSQL to initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    Write-Host "PostgreSQL container started successfully with user '$DB_USER' and database '$DB_NAME'" -ForegroundColor Green
}
else {
    Write-Host "PostgreSQL container already running" -ForegroundColor Yellow
}

# Start the application container (which runs backend server but also serves frontend files)
Write-Host "Starting the application container..." -ForegroundColor Yellow
docker run -d `
    --name $CONTAINER_NAME `
    --restart always `
    --network memorieswalk-network `
    -p 3000:3000 `
    -v "${HOST_DATA_DIR}:/app/server/file_storage" `
    --env-file $SERVER_ENV_PATH `
    --env-file $FRONTEND_ENV_PATH `
    $IMAGE_NAME

# Check if database initialization is needed
$SCHEMA_FILE = "$BASE_DIR\schema.sql"
$NEED_DB_INIT = $false

# Wait a moment for containers to fully start
Write-Host "Waiting for containers to fully start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if this is the first deployment by checking if the database tables exist
Write-Host "Checking if database initialization is needed..." -ForegroundColor Yellow
try {
    $DB_TABLE_COUNT = docker exec -i $POSTGRES_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" | ForEach-Object { $_.Trim() }
    
    if ([int]$DB_TABLE_COUNT -lt 5) {
        Write-Host "This appears to be a fresh installation. Database initialization is needed." -ForegroundColor Yellow
        $NEED_DB_INIT = $true
        
        # Copy schema.sql to the host if it doesn't exist
        if (-not (Test-Path $SCHEMA_FILE)) {
            Write-Host "Copying schema.sql from application container..." -ForegroundColor Yellow
            docker cp "${CONTAINER_NAME}:/app/database/schema.sql" $SCHEMA_FILE
            
            if (-not (Test-Path $SCHEMA_FILE)) {
                Write-Host "Warning: Could not find schema.sql in the container" -ForegroundColor Red
                Write-Host "Continuing anyway. You may need to initialize the database manually." -ForegroundColor Yellow
                $NEED_DB_INIT = $false
            }
        }
        
        # Initialize the database if needed and if we have the schema file
        if ($NEED_DB_INIT -and (Test-Path $SCHEMA_FILE)) {
            Write-Host "Initializing database with schema..." -ForegroundColor Yellow
            Get-Content $SCHEMA_FILE | docker exec -i $POSTGRES_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME
            Write-Host "Database initialization completed successfully!" -ForegroundColor Green
        }
    }
    else {
        Write-Host "Database is already initialized. Skipping initialization." -ForegroundColor Green
    }
} catch {
    Write-Host "Error checking database tables. You may need to initialize the database manually." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now access the application at:" -ForegroundColor Green
Write-Host "http://localhost:3000" -ForegroundColor Green
Write-Host "Note: In production, both frontend and backend are served from port 3000" -ForegroundColor Green
