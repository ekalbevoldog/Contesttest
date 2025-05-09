#!/bin/bash
# Start script for the Contested application

echo "Starting Contested server with proper configuration..."

# Ensure the script is executable
chmod +x ./run-server.sh

# Create a necessary link from public to client to ensure proper file serving
echo "Setting up environment for proper file serving..."
mkdir -p public
if [ ! -f public/index.html ]; then
  echo "Linking client/index.html to public directory for development..."
  cp client/index.html public/index.html
fi

# Start the server with the correct Supabase configuration
echo "Launching server via run-server.sh script..."
./run-server.sh