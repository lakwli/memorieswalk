#!/bin/bash
set -e

# Wait for Postgres
until pg_isready -h "$DB_HOST" -U "$DB_USER"; do
  echo "Waiting for Postgres..."
  sleep 2
done

# Run DB init script (ignore errors if already applied)
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f /app/schema.sql || true

# Start backend server
exec node /app/backend/server.js
