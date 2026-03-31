#!/usr/bin/env bash

set -e

# clean old build output
npm run clean

echo "Bundle Lambda package..."

# Install ALL deps (needed for tsc)
echo "Installing dependencies..."
npm ci

# Build TS
echo "Compiling TypeScript..."
npm run build

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

echo "Build complete"