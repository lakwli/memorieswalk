#!/bin/bash
# filepath: /workspace/server/scripts/runMigration.sh

echo "Running Canvas to Memory Migration Script..."
cd /workspace/server
node scripts/migrateCanvasToMemory.js
