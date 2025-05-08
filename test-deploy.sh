#!/bin/bash

# Test deployment script for the application
# This script verifies that the build and deployment process works correctly without fallbacks

echo "🧪 Testing deployment process with strict settings..."

# Clean up previous builds
rm -rf dist
rm -rf client/dist

# Run the strict build
echo "🔨 Running strict build process..."
node unified-build-strict.js
BUILD_RESULT=$?

if [ $BUILD_RESULT -ne 0 ]; then
  echo "❌ Build failed with exit code $BUILD_RESULT"
  exit 1
fi

echo "✅ Build completed successfully"

# Check critical files exist
if [ ! -f "dist/index.js" ]; then
  echo "❌ dist/index.js not found - build incomplete"
  exit 1
fi

if [ ! -d "dist/public" ]; then
  echo "❌ dist/public directory not found - build incomplete"
  exit 1
fi

echo "✅ All critical build files verified"

# Create a package.json file for deployment
echo "📦 Creating deployment package.json..."
cat > dist/package.json << EOF
{
  "name": "nil-connect-production",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "NODE_ENV=production node index.js"
  },
  "engines": {
    "node": ">=18"
  }
}
EOF

echo "✅ Deployment package.json created"
echo "🎉 Deployment test completed successfully"
echo ""
echo "To deploy the application:"
echo "1. Run: node unified-build-strict.js"
echo "2. Deploy the 'dist' directory to your hosting provider"
echo "3. Start the server with: NODE_ENV=production node index.js"