#!/bin/bash
# Start the server with the proper environment variables

echo "Starting server with Supabase configuration..."

# Create necessary directories if they don't exist
mkdir -p public client/dist

# Prepare public directory for React app
if [ ! -f public/index.html ] && [ -f client/index.html ]; then
  echo "Copying client/index.html to public/ for proper serving..."
  cp client/index.html public/index.html
fi

# Export NODE_ENV for development mode
export NODE_ENV=development

# Run the server
echo "Starting server in development mode..."
node server.js