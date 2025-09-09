#!/bin/bash

echo "=== Local npm install script ==="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found in current directory"
    echo "Please run this script from the importer directory"
    exit 1
fi

echo "1. Checking current directory:"
pwd
ls -la
echo ""

echo "2. Checking if node_modules already exists:"
if [ -d "node_modules" ]; then
    echo "  ✅ node_modules directory exists"
    echo "  Size: $(du -sh node_modules | cut -f1)"
else
    echo "  ❌ node_modules directory does not exist"
fi

echo ""
echo "3. Checking npm availability:"
if command -v npm &> /dev/null; then
    echo "  ✅ npm is available"
    npm --version
else
    echo "  ❌ npm is not available"
    echo "  Please install Node.js and npm first"
    exit 1
fi

echo ""
echo "4. Checking network connectivity to npm registry:"
if curl -s --connect-timeout 10 https://registry.npmjs.org/ >/dev/null; then
    echo "  ✅ Can reach npm registry"
else
    echo "  ❌ Cannot reach npm registry"
    echo "  Trying alternative approaches..."
fi

echo ""
echo "5. Performing npm install:"
echo "  Installing dependencies from package.json..."

# Try npm install with different approaches
if npm install --verbose; then
    echo "  ✅ npm install completed successfully"
else
    echo "  ❌ npm install failed"
    echo ""
    echo "  Trying with different registry..."
    if npm install --registry https://registry.npmjs.org/ --verbose; then
        echo "  ✅ npm install with explicit registry completed"
    else
        echo "  ❌ npm install with explicit registry also failed"
        echo ""
        echo "  Trying with increased timeout..."
        if npm install --timeout=60000 --verbose; then
            echo "  ✅ npm install with increased timeout completed"
        else
            echo "  ❌ All npm install attempts failed"
            echo "  Please check your network connectivity"
            exit 1
        fi
    fi
fi

echo ""
echo "6. Verifying installed packages:"
if [ -d "node_modules" ]; then
    echo "  ✅ node_modules created successfully"
    echo "  Installed packages:"
    ls node_modules/
    echo ""
    echo "  Total size: $(du -sh node_modules | cut -f1)"
else
    echo "  ❌ node_modules directory not created"
    exit 1
fi

echo ""
echo "7. Creating a tar archive for container use:"
tar -czf node_modules.tar.gz node_modules/
echo "  ✅ Created node_modules.tar.gz"
echo "  Size: $(du -sh node_modules.tar.gz | cut -f1)"

echo ""
echo "=== Setup complete ==="
echo "You can now use the node_modules.tar.gz file in your container"
echo "or the local node_modules directory for development" 