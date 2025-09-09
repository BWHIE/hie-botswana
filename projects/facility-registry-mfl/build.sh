#!/bin/bash

echo "Building Facility Registry MFL API..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "Error: Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "Node.js version: $(node -v)"

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building the application..."
npm run build

if [ $? -eq 0 ]; then
    echo "Build completed successfully!"
    echo "You can now run the application with: npm run start:prod"
    echo "Or use Docker: docker-compose up --build"
else
    echo "Build failed!"
    exit 1
fi
