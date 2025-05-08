#!/bin/bash

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Function to clean up existing server processes
cleanup_processes() {
  echo -e "${YELLOW}🧹 Cleaning up existing server processes...${NC}"
  
  # First, terminate any existing server processes
  local server_processes=("tsx server/index.ts" "node.*server/index.ts" "node server.js" "node --require.*server/index.ts")
  
  for pattern in "${server_processes[@]}"; do
    pkill -f "$pattern" > /dev/null 2>&1 || true
  done
  
  # Then, ensure the specified port is free
  local PORT_TO_USE=${PORT:-5000}
  echo -e "${YELLOW}Ensuring port $PORT_TO_USE is free...${NC}"
  
  # Find and kill any process on the specified port
  # fuser and pkill combined approach for maximum compatibility
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${PORT_TO_USE}/tcp" > /dev/null 2>&1 || true
  fi
  pkill -f ":${PORT_TO_USE}" > /dev/null 2>&1 || true
  
  # Wait a moment to ensure processes are terminated
  sleep 2
  
  # Verify port is now free
  if command -v nc >/dev/null 2>&1 && nc -z localhost $PORT_TO_USE >/dev/null 2>&1; then
    echo -e "${RED}⚠️ Warning: Port $PORT_TO_USE is still in use. Manual intervention may be required.${NC}"
  else
    echo -e "${GREEN}✅ Environment ready for new server${NC}"
  fi
}

# Get port or use default
PORT=${PORT:-5000}

# Determine environment
NODE_ENV="${NODE_ENV:-development}"
echo -e "${BLUE}${BOLD}📦 Running application in $NODE_ENV mode on port $PORT${NC}"

# Check for required environment variables
if [[ -z "$DATABASE_URL" ]]; then
  echo -e "${YELLOW}⚠️  WARNING: DATABASE_URL environment variable is not set${NC}"
else
  echo -e "${GREEN}✓ Database URL configured${NC}"
fi

# Clean up existing processes before starting
cleanup_processes

# Create logs directory if it doesn't exist
mkdir -p logs

# Determine the server start command
if [[ "$NODE_ENV" == "production" ]]; then
  # Production mode - build and run
  echo -e "${CYAN}${BOLD}🚀 Building application for production...${NC}"
  node unified-build.js
  
  SERVER_CMD="PORT=$PORT NODE_ENV=production node server.js"
  LOG_FILE="logs/production-server.log"
else
  # Development mode with hot reloading
  echo -e "${CYAN}${BOLD}🔄 Starting development server with hot reloading${NC}"
  SERVER_CMD="PORT=$PORT npx tsx server/index.ts"
  LOG_FILE="logs/dev-server.log"
fi

# Function to run the server
run_server() {
  echo -e "${CYAN}${BOLD}🚀 Starting server with command: ${SERVER_CMD}${NC}"
  echo "Server started at $(date)" > "$LOG_FILE"
  echo "Command: $SERVER_CMD" >> "$LOG_FILE"
  
  # Execute the server command
  eval "$SERVER_CMD" 2>&1 | tee -a "$LOG_FILE"
  
  # Capture the exit code
  local EXIT_CODE=$?
  if [ $EXIT_CODE -ne 0 ]; then
    echo -e "${RED}Server exited with code $EXIT_CODE${NC}"
    echo "Server exited with code $EXIT_CODE at $(date)" >> "$LOG_FILE"
  fi
  
  return $EXIT_CODE
}

# Run the server
run_server