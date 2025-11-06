#!/bin/bash

# EMERGENCY OAUTH SERVER STARTUP SCRIPT
cd /Users/larstuesca/Documents/agent-girl/chat-ac5267c7
echo "🚀 Starting Emergency OAuth Server..."
echo "📁 Directory: $(pwd)"
echo "📄 File exists: $(ls -la simple-oauth-server.cjs | wc -l)"

# Kill any existing OAuth servers
pkill -f "simple-oauth-server" 2>/dev/null || true
sleep 1

# Start the OAuth server
echo "🔧 Starting OAuth server..."
node simple-oauth-server.cjs