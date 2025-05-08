#!/bin/bash

# Verification Script for No-Fallback Systems
# This script checks that all components work without fallbacks

# ANSI colors
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RESET="\033[0m"

echo -e "${BLUE}🔍 Verifying all systems for no-fallback operation...${RESET}"

# Create a results array
declare -a FAILURES

# Function to check a specific file for fallback mechanisms
check_file_for_fallbacks() {
  local file=$1
  local patterns=("fallback" "try.*catch.*try" "backup" "alternative" "plan B")
  local exclude_patterns=("no fallback" "no-fallback" "without fallback" "strict" "proper")
  
  echo -e "\n${YELLOW}Checking $file for fallback mechanisms...${RESET}"
  
  # Search for fallback patterns while excluding legitimate occurrences
  for pattern in "${patterns[@]}"; do
    results=$(grep -i "$pattern" "$file" | grep -v -E "$(IFS="|"; echo "${exclude_patterns[*]}")" || true)
    if [ ! -z "$results" ]; then
      echo -e "${RED}⚠️ Possible fallback found in $file:${RESET}"
      echo "$results" | sed 's/^/  /'
      FAILURES+=("$file: Contains potential fallback mechanisms")
    fi
  done
}

# Check core server files
echo -e "\n${BLUE}Step 1: Examining core server files${RESET}"
core_files=(
  "server.js"
  "server/index.ts"
  "server/routes.ts"
  "server/middleware/auth.ts"
  "server/services/unifiedAuthService.ts"
)

for file in "${core_files[@]}"; do
  if [ -f "$file" ]; then
    check_file_for_fallbacks "$file"
  else
    echo -e "${RED}❌ File not found: $file${RESET}"
    FAILURES+=("Missing core file: $file")
  fi
done

# Verify build scripts
echo -e "\n${BLUE}Step 2: Verifying build scripts${RESET}"
if [ -f "unified-build-strict.js" ]; then
  echo -e "${GREEN}✓ unified-build-strict.js exists${RESET}"
else
  echo -e "${RED}❌ unified-build-strict.js not found${RESET}"
  FAILURES+=("Missing unified-build-strict.js")
fi

if [ -f "strict-deploy.js" ]; then
  echo -e "${GREEN}✓ strict-deploy.js exists${RESET}"
else
  echo -e "${RED}❌ strict-deploy.js not found${RESET}"
  FAILURES+=("Missing strict-deploy.js")
fi

# Verify server typescript builds correctly
echo -e "\n${BLUE}Step 3: Verifying TypeScript compilation${RESET}"
rm -rf dist
mkdir -p dist
echo -e "${YELLOW}Running TypeScript compilation...${RESET}"
tsc -p tsconfig.build.json > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ TypeScript compilation failed${RESET}"
  FAILURES+=("TypeScript compilation failed")
else
  echo -e "${GREEN}✓ TypeScript compilation succeeded${RESET}"
fi

# Check if declaration files are in place for JavaScript modules
echo -e "\n${BLUE}Step 4: Verifying declaration files for JS modules${RESET}"
js_files=$(find server -type f -name "*.js" -not -path "*/node_modules/*")
for js_file in $js_files; do
  d_file="${js_file%.*}.d.ts"
  if [ ! -f "$d_file" ]; then
    echo -e "${YELLOW}⚠️ No declaration file for $js_file${RESET}"
  else
    echo -e "${GREEN}✓ Declaration file exists for $js_file${RESET}"
  fi
done

# Check for fallbacks in client auth code
echo -e "\n${BLUE}Step 5: Examining client authentication${RESET}"
client_auth_files=(
  "client/src/hooks/use-auth.tsx"
  "client/src/contexts/WebSocketProvider.tsx"
)

for file in "${client_auth_files[@]}"; do
  if [ -f "$file" ]; then
    check_file_for_fallbacks "$file"
  else
    echo -e "${YELLOW}⚠️ File not found: $file${RESET}"
  fi
done

# Final summary
echo -e "\n${BLUE}=== Verification Summary ===${RESET}"
if [ ${#FAILURES[@]} -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed! The system appears to be operating without fallbacks.${RESET}"
else
  echo -e "${RED}❌ There were ${#FAILURES[@]} failures:${RESET}"
  for failure in "${FAILURES[@]}"; do
    echo -e "${RED}  - $failure${RESET}"
  done
fi