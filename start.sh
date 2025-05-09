#!/bin/bash
# Start script for the Contested application

echo "Starting Contested server on port 5000..."

# Create necessary directories and prepare files
mkdir -p public
mkdir -p client/dist

# Copy client/index.html to public for proper serving
if [ -f client/index.html ]; then
  cp client/index.html public/index.html
  echo "✓ Copied client/index.html to public/"
fi

# Set environment variables
export NODE_ENV=development
export PORT=5000

# Run the server - direct and simple
echo "Launching server..."
exec npx tsx server/index.ts