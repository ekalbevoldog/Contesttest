#!/bin/bash

echo "Starting custom build process..."

# Create a .env file for the build if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating default .env file for build"
  touch .env
fi

# Build the server-side code with the build-specific tsconfig
echo "Building server-side code..."
npx tsc -p tsconfig.build.json

# Copy necessary files
echo "Copying additional files to dist folder..."
cp -f server/supabase-migration.sql dist/ 2>/dev/null || :
cp -f .env* dist/ 2>/dev/null || :

# Build the client-side code using Vite
echo "Building client-side code..."
npx vite build

echo "Build complete!"