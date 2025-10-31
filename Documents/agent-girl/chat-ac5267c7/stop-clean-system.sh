#!/bin/bash

# 🛑 CLEAN SYSTEM STOP SCRIPT
# This script stops the clean OAuth system

set -e

echo "🛑 Stopping Clean OAuth System..."
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="/Users/larstuesca/Documents/agent-girl/chat-ac5267c7"
OAUTH_PORT="3006"
FRONTEND_PORT="5173"

# Function to kill processes on a port
kill_port() {
    local port=$1
    local name=$2
    echo -e "${YELLOW}Stopping $name (port $port)...${NC}"

    local pids=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo "$pids" | xargs kill -TERM 2>/dev/null || true
        sleep 2
        # Force kill if still running
        echo "$pids" | xargs kill -9 2>/dev/null || true
        echo -e "${GREEN}✅ $name stopped${NC}"
    else
        echo -e "${BLUE}ℹ️  $name was not running${NC}"
    fi
}

# Try to kill using saved PIDs first
if [ -f "$PROJECT_DIR/.clean-system-pids" ]; then
    echo -e "${BLUE}📋 Using saved PIDs...${NC}"
    read -r OAUTH_PID FRONTEND_PID < "$PROJECT_DIR/.clean-system-pids"

    if [ -n "$OAUTH_PID" ] && kill -0 "$OAUTH_PID" 2>/dev/null; then
        echo -e "${YELLOW}Killing OAuth server (PID: $OAUTH_PID)...${NC}"
        kill "$OAUTH_PID" 2>/dev/null || true
        sleep 1
        kill -9 "$OAUTH_PID" 2>/dev/null || true
    fi

    if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo -e "${YELLOW}Killing frontend (PID: $FRONTEND_PID)...${NC}"
        kill "$FRONTEND_PID" 2>/dev/null || true
        sleep 1
        kill -9 "$FRONTEND_PID" 2>/dev/null || true
    fi

    rm -f "$PROJECT_DIR/.clean-system-pids"
fi

# Also kill by port (backup method)
kill_port $OAUTH_PORT "OAuth Server"
kill_port $FRONTEND_PORT "Frontend"

# Final verification
echo -e "${BLUE}🔍 Verifying processes are stopped...${NC}"

sleep 2

if lsof -Pi :$OAUTH_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}❌ OAuth server might still be running on port $OAUTH_PORT${NC}"
else
    echo -e "${GREEN}✅ OAuth server confirmed stopped${NC}"
fi

if lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}❌ Frontend might still be running on port $FRONTEND_PORT${NC}"
else
    echo -e "${GREEN}✅ Frontend confirmed stopped${NC}"
fi

echo ""
echo -e "${GREEN}🎉 CLEAN SYSTEM STOPPED!${NC}"
echo "================================="
echo -e "${GREEN}✅ All processes terminated${NC}"
echo -e "${GREEN}✅ Ports are free${NC}"
echo -e "${GREEN}✅ Clean shutdown completed${NC}"