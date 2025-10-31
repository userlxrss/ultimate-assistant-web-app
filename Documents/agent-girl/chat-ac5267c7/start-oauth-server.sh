#!/bin/bash

# 🚀 Simple OAuth Server Startup Script
# Replaces the complex CardDAV bridge with Google OAuth 2.0

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║  🚀 STARTING SIMPLE OAUTH SERVER                            ║"
echo "║                                                              ║"
echo "║  This replaces the complex CardDAV + app password system     ║"
echo "║  with simple, secure Google OAuth 2.0 authentication        ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ ERROR: .env file not found!"
    echo ""
    echo "Please set up your environment first:"
    echo "1. Copy the template: cp .env.oauth .env"
    echo "2. Edit .env and add your Google OAuth credentials"
    echo "3. Get credentials from: https://console.cloud.google.com/"
    echo ""
    exit 1
fi

# Check if required dependencies are installed
echo "🔍 Checking dependencies..."
if ! npm list express cors googleapis express-session memorystore dotenv > /dev/null 2>&1; then
    echo "📦 Installing missing dependencies..."
    npm run install-oauth-deps
fi

# Check if any processes are using port 3006
echo "🔍 Checking for processes on port 3006..."
if lsof -Pi :3006 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3006 is in use. Stopping existing processes..."
    lsof -ti:3006 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Kill any existing CardDAV processes (cleanup)
echo "🧹 Cleaning up any old CardDAV processes..."
pkill -f "carddav" 2>/dev/null || true
pkill -f "working-carddav-bridge" 2>/dev/null || true

echo "✅ Starting OAuth Server on port 3006..."
echo "📱 Frontend should be running on: http://localhost:5173"
echo ""

# Start the OAuth server
node simple-oauth-server.cjs