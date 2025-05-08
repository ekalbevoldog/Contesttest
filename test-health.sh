#!/bin/bash

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to check HTTP endpoint
check_endpoint() {
  local url=$1
  local description=$2
  local expected_status=${3:-200}
  
  echo -e "${CYAN}Testing ${description}...${NC}"
  
  # Try to get the endpoint with timeout
  local response=$(curl -s -o response.json -w "%{http_code}" --connect-timeout 5 "${url}" 2>/dev/null)
  local exit_code=$?
  
  # Check if curl was successful
  if [ $exit_code -ne 0 ]; then
    echo -e "${RED}✗ Failed to connect to ${url} (curl exit code: ${exit_code})${NC}"
    return 1
  fi
  
  # Check HTTP status code
  if [ "$response" -ne "$expected_status" ]; then
    echo -e "${RED}✗ Expected status ${expected_status}, got ${response}${NC}"
    if [ -f response.json ]; then
      echo -e "${YELLOW}Response body:${NC}"
      cat response.json
    fi
    return 1
  fi
  
  # Check if response contains valid JSON
  if [ -f response.json ]; then
    if ! jq . response.json > /dev/null 2>&1; then
      echo -e "${RED}✗ Response is not valid JSON${NC}"
      echo -e "${YELLOW}Response body:${NC}"
      cat response.json
      return 1
    fi
    
    echo -e "${GREEN}✓ ${description} - Status: ${response}${NC}"
    
    # If requested, show response body
    if [ "$4" = "show" ]; then
      echo -e "${YELLOW}Response body:${NC}"
      jq . response.json
    fi
  else
    echo -e "${RED}✗ No response body received${NC}"
    return 1
  fi
  
  return 0
}

# Get server host and port from arguments or use default
HOST=${1:-"localhost"}
PORT=${2:-"5000"}
BASE_URL="http://${HOST}:${PORT}"

echo -e "${BLUE}=== Server Health Check ====${NC}"
echo -e "${BLUE}Testing server at ${BASE_URL}${NC}"

# Check basic health endpoint
check_endpoint "${BASE_URL}/health" "Basic health check" 200 show
BASIC_HEALTH_STATUS=$?

# Check detailed health endpoint
check_endpoint "${BASE_URL}/health/detailed" "Detailed health info" 200 show
DETAILED_HEALTH_STATUS=$?

# Check WebSocket health endpoint
check_endpoint "${BASE_URL}/health/websocket" "WebSocket status" 200 show
WEBSOCKET_STATUS=$?

# Cleanup
rm -f response.json

# Check if all tests passed
if [ $BASIC_HEALTH_STATUS -eq 0 ] && [ $DETAILED_HEALTH_STATUS -eq 0 ] && [ $WEBSOCKET_STATUS -eq 0 ]; then
  echo -e "${GREEN}✓ All health checks passed${NC}"
  exit 0
else
  echo -e "${RED}✗ Some health checks failed${NC}"
  exit 1
fi