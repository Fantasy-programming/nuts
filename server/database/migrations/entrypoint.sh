#!/bin/bash
set -e

# Construct database connection string
DBSTRING="host=${DB_HOST} port=${DB_PORT} user=${DB_USER} password=${DB_PASS} dbname=${DB_NAME} sslmode=${DB_SSL_MODE}"

# Verify we can connect
echo "Verifying database connection..."
goose postgres "${DBSTRING}" status

# Run the migrations
echo "Running migrations..."
goose postgres "${DBSTRING}" up

# Verify migration status
echo "Verifying migration status..."
goose postgres "${DBSTRING}" status

echo "Migrations completed successfully!"
