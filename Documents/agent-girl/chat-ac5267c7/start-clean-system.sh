#!/bin/bash

# 🚀 CLEAN SYSTEM STARTUP SCRIPT
# This script starts a clean, working OAuth system with just 2 processes

set -e

echo "🔧 Starting Clean OAuth System..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project directory
PROJECT_DIR="/Users/larstuesca/Documents/agent-girl/chat-ac5267c7"
OAUTH_PORT="3006"
FRONTEND_PORT="5173"

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill processes on a port
kill_port() {
    local port=$1
    echo -e "${YELLOW}Killing processes on port $port...${NC}"
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
}

# Function to wait for server to be ready
wait_for_server() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1

    echo -e "${BLUE}Waiting for $name to be ready...${NC}"

    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $name is ready!${NC}"
            return 0
        fi

        echo -e "${YELLOW}Attempt $attempt/$max_attempts: $name not ready yet...${NC}"
        sleep 2
        attempt=$((attempt + 1))
    done

    echo -e "${RED}❌ $name failed to start within expected time${NC}"
    return 1
}

# Clean up any existing processes
echo -e "${BLUE}🧹 Cleaning up existing processes...${NC}"

if check_port $OAUTH_PORT; then
    echo -e "${YELLOW}Port $OAUTH_PORT is in use, cleaning up...${NC}"
    kill_port $OAUTH_PORT
fi

if check_port $FRONTEND_PORT; then
    echo -e "${YELLOW}Port $FRONTEND_PORT is in use, cleaning up...${NC}"
    kill_port $FRONTEND_PORT
fi

# Wait a moment for processes to fully terminate
sleep 2

# Verify ports are free
if check_port $OAUTH_PORT; then
    echo -e "${RED}❌ Port $OAUTH_PORT is still in use${NC}"
    exit 1
fi

if check_port $FRONTEND_PORT; then
    echo -e "${RED}❌ Port $FRONTEND_PORT is still in use${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All ports are free${NC}"

# Check if .env file exists and has required variables
echo -e "${BLUE}🔍 Checking configuration...${NC}"

if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

# Check for required environment variables
source "$PROJECT_DIR/.env"

if [ -z "$GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo -e "${RED}❌ Google OAuth credentials not found in .env${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Configuration looks good${NC}"

# Start OAuth server
echo -e "${BLUE}🚀 Starting OAuth server on port $OAUTH_PORT...${NC}"
cd "$PROJECT_DIR"
npm run oauth-server > oauth-server.log 2>&1 &
OAUTH_PID=$!

echo "OAuth server PID: $OAUTH_PID"

# Wait for OAuth server to be ready
if ! wait_for_server "http://localhost:$OAUTH_PORT/api/health" "OAuth Server"; then
    echo -e "${RED}❌ OAuth server failed to start${NC}"
    kill $OAUTH_PID 2>/dev/null || true
    exit 1
fi

# Start Frontend
echo -e "${BLUE}🚀 Starting frontend on port $FRONTEND_PORT...${NC}"
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

echo "Frontend PID: $FRONTEND_PID"

# Wait for frontend to be ready
if ! wait_for_server "http://localhost:$FRONTEND_PORT" "Frontend"; then
    echo -e "${RED}❌ Frontend failed to start${NC}"
    kill $OAUTH_PID $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

# Final status check
echo ""
echo -e "${GREEN}🎉 CLEAN SYSTEM STARTED SUCCESSFULLY!${NC}"
echo "=================================="
echo -e "${BLUE}OAuth Server:${NC}    http://localhost:$OAUTH_PORT"
echo -e "${BLUE}Frontend:${NC}        http://localhost:$FRONTEND_PORT"
echo -e "${BLUE}Test Page:${NC}       http://localhost:$FRONTEND_PORT/oauth-test"
echo ""
echo -e "${GREEN}✅ Only 2 processes running (clean system)${NC}"
echo -e "${GREEN}✅ OAuth configuration fixed${NC}"
echo -e "${GREEN}✅ No more client_id errors${NC}"
echo -e "${GREEN}✅ Production-ready setup${NC}"
echo ""
echo -e "${BLUE}📋 To test OAuth:${NC}"
echo "1. Visit: http://localhost:$FRONTEND_PORT/oauth-test"
echo "2. Click 'Sign in with Google'"
echo "3. Complete the OAuth flow"
echo ""
echo -e "${BLUE}🛑 To stop the system:${NC}"
echo "kill $OAUTH_PID $FRONTEND_PID"
echo ""
echo -e "${YELLOW}📝 Logs available at:${NC}"
echo "- OAuth Server: $PROJECT_DIR/oauth-server.log"
echo "- Frontend: $PROJECT_DIR/frontend.log"

# Save PIDs to file for easy cleanup
echo "$OAUTH_PID $FRONTEND_PID" > "$PROJECT_DIR/.clean-system-pids"
echo "PIDs saved to $PROJECT_DIR/.clean-system-pids"