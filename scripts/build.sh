#!/usr/bin/env bash

set -e

echo "Building Lambda package..."

rm -rf build server.zip dist

# Install ALL deps (needed for tsc)
echo "Installing dependencies..."
npm ci

# Build TS
echo "🔨 Compiling TypeScript..."
npx tsc

# Create build dir
mkdir -p build

# Copy compiled JS
cp -r dist/* build/
cp package.json build/

# Copy node_modules (then prune)
cp -r node_modules build/

cd build

# Remove dev dependencies
echo "Removing dev dependencies..."
npm prune --omit=dev

# Zip
echo "Creating zip..."
zip -r ../server.zip .

cd ..

echo "✅ Build complete"