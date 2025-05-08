#!/bin/bash

# Build both client and server
echo "🔨 Building client..."
npx vite build

echo "🔨 Building server..."
node scripts/build-with-fallback.js

echo "✅ Full build completed"