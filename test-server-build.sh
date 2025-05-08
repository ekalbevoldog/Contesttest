#!/bin/bash

# Test server-only build
# This script verifies that the server build works correctly without fallbacks

echo "🧪 Testing server-only strict build process..."

# Clean up previous builds
rm -rf dist

# Create dist directory
mkdir -p dist

# Run TypeScript compilation with strict settings
echo "🔨 Building server with TypeScript..."
tsc -p tsconfig.build.json
BUILD_RESULT=$?

if [ $BUILD_RESULT -ne 0 ]; then
  echo "❌ Server build failed with exit code $BUILD_RESULT"
  exit 1
fi

echo "✅ Server build completed successfully"

# Check critical files exist
if [ ! -f "dist/server/index.js" ]; then
  echo "❌ dist/server/index.js not found - build incomplete"
  exit 1
fi

echo "✅ All critical server files verified"
echo "🎉 Server build test completed successfully"