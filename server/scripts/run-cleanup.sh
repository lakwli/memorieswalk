#!/bin/bash

# Cleanup Script Wrapper
# ----------------------
# This script runs the cleanup.js script from the server directory

# Change to the server directory
cd "$(dirname "$0")/.."

# Display warning and confirmation prompt
echo "WARNING: This will permanently delete all photos and related records from the database."
echo "This action cannot be undone!"
echo ""
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo ""

# Check if the user confirmed
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Cleanup cancelled."
    exit 0
fi

# Run the cleanup script
echo "Running cleanup script..."
node scripts/cleanup.js

# Exit with the same status as the Node script
exit $?
