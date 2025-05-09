#!/bin/bash
# Run script that initializes the app with proper workflow configuration

echo "Setting up Contested application with workflow configuration..."

# Ensure workflows directory exists
mkdir -p .replit/workflows

# Create workflow configuration
cat > .replit/workflows/replit.json << EOF
{
  "version": 1,
  "runOnStart": true, 
  "persistOnStart": true,
  "apps": [
    {
      "name": "Contested App Server",
      "command": "chmod +x ./run-server.sh && ./run-server.sh",
      "runOnSave": false,
      "persistent": true,
      "ports": [3002]
    }
  ]
}
EOF

echo "Workflow configuration created."

# Make the run-server.sh script executable
chmod +x ./run-server.sh

# Start the server directly
echo "Starting the server..."
./run-server.sh