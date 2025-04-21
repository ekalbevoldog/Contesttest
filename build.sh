#!/bin/bash

echo "Starting custom build process..."

# Create a .env file for the build if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating default .env file for build"
  touch .env
fi

# Ensure dist directory exists and it's empty
rm -rf dist
mkdir -p dist

# Set environment variables for build
export NODE_ENV=production

# Use our custom build script for TypeScript
echo "Building server-side code using custom build script..."
node build-ts-only.js

# Build the client-side code using Vite
echo "Building client-side code..."
npx vite build

# Final directory structure check
echo "Checking final build structure..."
find dist -type f -name "*.js" | head -n 5

echo "Build complete!"