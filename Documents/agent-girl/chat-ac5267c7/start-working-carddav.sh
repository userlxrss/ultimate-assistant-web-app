#!/bin/bash

# Working CardDAV Bridge Startup Script
# This script starts the custom CardDAV bridge that provides working CardDAV access to Google Contacts

echo "🚀 Starting Working CardDAV Bridge for Google Contacts..."
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if required dependencies are available
if [ ! -f "working-carddav-bridge.cjs" ]; then
    echo "❌ working-carddav-bridge.cjs not found. Please ensure the file exists in the current directory."
    exit 1
fi

# Check if node_modules exists and has required packages
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check for required packages
REQUIRED_PACKAGES=("express" "cors" "googleapis" "node-fetch" "xml2js")
for package in "${REQUIRED_PACKAGES[@]}"; do
    if ! npm list "$package" &> /dev/null; then
        echo "📦 Installing missing package: $package"
        npm install "$package"
    fi
done

echo "✅ Dependencies checked and ready"

# Start the CardDAV bridge
echo "🌉 Starting Working CardDAV Bridge on port 3014..."
echo "📊 Health endpoint: http://localhost:3014/health"
echo "🔗 CardDAV endpoints: http://localhost:3014/carddav/"
echo "📱 This bridge provides working CardDAV access to Google Contacts"
echo ""
echo "📋 Usage:"
echo "   1. Enable 2-Step Verification in your Google Account"
echo "   2. Generate an app password for 'Mail' or 'Other'"
echo "   3. Use your Gmail and app password in the contacts app"
echo "   4. The bridge will translate CardDAV requests to Google Contacts API"
echo ""
echo "⚡ Starting server..."
echo "Press Ctrl+C to stop the bridge"
echo ""

# Start the server
node working-carddav-bridge.cjs