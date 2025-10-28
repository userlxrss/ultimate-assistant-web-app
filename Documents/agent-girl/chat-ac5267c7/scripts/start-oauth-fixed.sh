#!/bin/bash

# OAuth Server Startup Script - Fixed Version
# This script starts the OAuth server and React app with proper port configuration

set -e

echo "🚀 Starting OAuth System - Fixed Version"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
OAUTH_PORT=3006
REACT_PORT=5173
SERVER_DIR="server"

echo ""
echo "${BLUE}Configuration:${NC}"
echo "  OAuth Server Port: ${OAUTH_PORT}"
echo "  React App Port: ${REACT_PORT}"
echo "  Google Client ID: placeholder-google-client-id.apps.googleusercontent.com"
echo ""

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -i :$port >/dev/null 2>&1; then
        echo -e "${RED}❌ Port $port is already in use${NC}"
        lsof -i :$port | head -5
        return 1
    else
        echo -e "${GREEN}✅ Port $port is available${NC}"
        return 0
    fi
}

# Function to kill existing processes
kill_existing() {
    echo "${YELLOW}🧹 Cleaning up existing processes...${NC}"

    # Kill any existing OAuth servers
    pkill -f "simple-oauth-server" 2>/dev/null || true
    pkill -f "oauth-server" 2>/dev/null || true

    # Kill processes on our ports
    lsof -ti:$OAUTH_PORT | xargs kill -9 2>/dev/null || true
    lsof -ti:$REACT_PORT | xargs kill -9 2>/dev/null || true

    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Check if we're in the right directory
if [ ! -d "$SERVER_DIR" ]; then
    echo -e "${RED}❌ Server directory not found. Please run from project root.${NC}"
    exit 1
fi

# Check if server file exists
if [ ! -f "$SERVER_DIR/simple-oauth-server.cjs" ]; then
    echo -e "${RED}❌ OAuth server file not found: $SERVER_DIR/simple-oauth-server.cjs${NC}"
    exit 1
fi

# Check ports
echo "${BLUE}Checking port availability...${NC}"
if ! check_port $OAUTH_PORT; then
    echo -e "${YELLOW}⚠️ Port $OAUTH_PORT is in use. Cleaning up...${NC}"
    kill_existing
    sleep 2

    if ! check_port $OAUTH_PORT; then
        echo -e "${RED}❌ Could not free port $OAUTH_PORT. Please check manually.${NC}"
        exit 1
    fi
fi

if ! check_port $REACT_PORT; then
    echo -e "${YELLOW}⚠️ Port $REACT_PORT is in use. This might be the React app already running.${NC}"
fi

# Start OAuth Server
echo ""
echo "${BLUE}Starting OAuth Server...${NC}"
cd $SERVER_DIR

# Check if .env exists and has correct configuration
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found in server directory${NC}"
    exit 1
fi

# Verify .env has correct port
if grep -q "PORT=3006" .env; then
    echo -e "${GREEN}✅ .env file configured correctly${NC}"
else
    echo -e "${YELLOW}⚠️ Updating .env file with correct port...${NC}"
    sed -i.bak "s/PORT=.*/PORT=3006/" .env
fi

# Start OAuth server in background
echo "🔐 Starting OAuth server on port $OAUTH_PORT..."
PORT=$OAUTH_PORT node simple-oauth-server.cjs &
OAUTH_PID=$!

# Wait for server to start
echo "⏳ Waiting for OAuth server to start..."
sleep 3

# Test OAuth server
if curl -s "http://localhost:$OAUTH_PORT/health" >/dev/null; then
    echo -e "${GREEN}✅ OAuth Server started successfully (PID: $OAUTH_PID)${NC}"
else
    echo -e "${RED}❌ OAuth Server failed to start${NC}"
    kill $OAUTH_PID 2>/dev/null || true
    exit 1
fi

# Go back to project root
cd ..

# Start React App (optional, as it might already be running)
echo ""
echo "${BLUE}Starting React App...${NC}"
if ! curl -s "http://localhost:$REACT_PORT" >/dev/null; then
    echo "⚛️ Starting React app on port $REACT_PORT..."
    npm run dev &
    REACT_PID=$!

    # Wait for React app to start
    echo "⏳ Waiting for React app to start..."
    sleep 5

    # Test React app
    if curl -s "http://localhost:$REACT_PORT" >/dev/null; then
        echo -e "${GREEN}✅ React App started successfully (PID: $REACT_PID)${NC}"
    else
        echo -e "${YELLOW}⚠️ React App might still be starting...${NC}"
    fi
else
    echo -e "${GREEN}✅ React App is already running on port $REACT_PORT${NC}"
    REACT_PID=""
fi

# Display final status
echo ""
echo "🎉 ${GREEN}OAuth System is now running!${NC}"
echo "=================================="
echo ""
echo "📱 ${BLUE}Applications:${NC}"
echo "   OAuth Server: http://localhost:$OAUTH_PORT"
echo "   React App:    http://localhost:$REACT_PORT"
echo "   Test Page:    file://$(pwd)/oauth-test-complete.html"
echo ""
echo "🔐 ${BLUE}OAuth Configuration:${NC}"
echo "   Google Client ID: placeholder-google-client-id.apps.googleusercontent.com"
echo "   Redirect URI:      http://localhost:$OAUTH_PORT/auth/google/callback"
echo ""
echo "🚨 ${RED}IMPORTANT:${NC}"
echo "   Make sure to add the redirect URI to your Google Cloud Console!"
echo "   Go to: https://console.cloud.google.com/apis/credentials"
echo ""
echo "📋 ${BLUE}Process IDs:${NC}"
echo "   OAuth Server PID: $OAUTH_PID"
[ ! -z "$REACT_PID" ] && echo "   React App PID:   $REACT_PID"
echo ""
echo "🛑 ${YELLOW}To stop servers:${NC}"
echo "   kill $OAUTH_PID"
[ ! -z "$REACT_PID" ] && echo "   kill $REACT_PID"
echo "   Or run: pkill -f 'simple-oauth-server|vite'"
echo ""
echo "🧪 ${BLUE}To test the system:${NC}"
echo "   1. Open the test page: oauth-test-complete.html"
echo "   2. Or open React app and navigate to OAuth Connect"
echo "   3. Complete the Google OAuth flow"
echo ""

# Save PIDs to file for easy cleanup
echo "$OAUTH_PID" > .oauth-server.pid
[ ! -z "$REACT_PID" ] && echo "$REACT_PID" >> .oauth-server.pid

echo -e "${GREEN}✅ Setup complete! PIDs saved to .oauth-server.pid${NC}"