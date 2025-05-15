Write-Host "Starting PhotoSharing Docker cleanup..." -ForegroundColor Cyan

# Stop and remove containers
Write-Host "Stopping containers..." -ForegroundColor Yellow
docker stop dev postgres 2>$null
Write-Host "Removing containers..." -ForegroundColor Yellow
docker rm dev postgres 2>$null

# Remove project-specific volumes
Write-Host "Removing volumes..." -ForegroundColor Yellow
# Try standard volume names and with project prefix
docker volume ls --format "{{.Name}}" | Where-Object { 
    $_ -like "*postgres_data*" -or 
    $_ -like "*vscode_extensions*" -or 
    $_ -like "*vscode_extensions_cache*" -or
    $_ -like "*photosharing*" 
} | ForEach-Object {
    Write-Host "Removing volume: $_" -ForegroundColor Gray
    docker volume rm $_ 2>$null
}

# Get the image ID of the dev container if it exists
$devImage = (docker images -q "photosharing-dev") 2>$null
if ($devImage) {
    Write-Host "Removing development image..." -ForegroundColor Yellow
    docker rmi $devImage 2>$null
}

# Remove any dangling images related to the project (this won't affect other projects)
Write-Host "Cleaning up dangling images..." -ForegroundColor Yellow
docker image prune -f 2>$null

Write-Host "PhotoSharing Docker cleanup complete!" -ForegroundColor Green
Write-Host "You can now rebuild your dev container from scratch." -ForegroundColor Cyan
