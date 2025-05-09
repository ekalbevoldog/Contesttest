#!/bin/bash
# Start development server for both client and server

# Set environment variables
export NODE_ENV=development
export PORT=5000

echo "Starting development server..."

# Kill any existing processes
pkill -f "tsx server/index.ts" || true
pkill -f "vite" || true

# Start the server in the background
echo "Starting server on port 5000..."
tsx server/index.ts &
SERVER_PID=$!

# Wait for the server to start
sleep 2

# Start the client in the background
echo "Starting client..."
cd client && npx vite --host 0.0.0.0 &
CLIENT_PID=$!

# Function to handle cleanup
cleanup() {
  echo "Shutting down..."
  kill $SERVER_PID 2>/dev/null
  kill $CLIENT_PID 2>/dev/null
  exit 0
}

# Trap signals to ensure clean shutdown
trap cleanup SIGINT SIGTERM

# Wait for any process to exit
wait $SERVER_PID $CLIENT_PID

# Exit with status of process that exited first
exit $?