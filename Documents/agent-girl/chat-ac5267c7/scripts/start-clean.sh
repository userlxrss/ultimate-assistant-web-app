#!/bin/bash

# Clean Startup Script for Productivity Hub
# This script kills conflicting processes and starts the app cleanly

echo "🚀 Starting Productivity Hub Clean Startup..."
echo "============================================"

# Kill all conflicting processes
echo "🧹 Cleaning up conflicting processes..."
pkill -f "vite" 2>/dev/null || true
pkill -f "node.*gmail" 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true

# Kill processes on common ports
lsof -ti:5173,5174,5175,5176,5181,3000,3001,3002,8000,8080,8081 | xargs kill -9 2>/dev/null || true

echo "✅ Conflicting processes cleaned up"

# Wait a moment for processes to fully terminate
sleep 2

# Change to the correct directory
cd /Users/larstuesca/Documents/agent-girl/chat-ac5267c7

echo "📁 Working directory: $(pwd)"

# Check if node_modules exists and is complete
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

echo "✅ Dependencies ready"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "📝 Please edit .env file with your actual API keys and credentials"
    else
        echo "❌ .env.example file not found"
        exit 1
    fi
fi

# Function to start development server
start_dev_server() {
    echo "🌐 Starting development server..."
    npm run dev &
    DEV_PID=$!
    echo "✅ Development server started with PID: $DEV_PID"

    # Wait a moment for the server to start
    sleep 3

    # Check if server is responding
    if curl -s http://localhost:5173 > /dev/null; then
        echo "✅ Development server is responding on http://localhost:5173"
    else
        echo "⚠️  Development server might still be starting..."
    fi
}

# Function to start Gmail integration (optional)
start_gmail_integration() {
    echo "📧 Starting Gmail integration..."
    node gmail-imap-server.cjs &
    GMAIL_PID=$!
    echo "✅ Gmail integration started with PID: $GMAIL_PID"
}

# Function to start backend server (optional)
start_backend_server() {
    if [ -d "server" ]; then
        echo "🔧 Starting backend server..."
        cd server
        npm start &
        BACKEND_PID=$!
        cd ..
        echo "✅ Backend server started with PID: $BACKEND_PID"

        # Wait a moment for the backend to start
        sleep 2

        # Check if backend is responding
        if curl -s http://localhost:3001/health > /dev/null 2>&1; then
            echo "✅ Backend server is responding on http://localhost:3001"
        else
            echo "⚠️  Backend server might still be starting..."
        fi
    fi
}

# Main startup sequence
echo "🚀 Starting application components..."

# Start the main development server
start_dev_server

# Optional: Start Gmail integration if .env has Gmail credentials
if grep -q "SMTP_USER=" .env && grep -q "SMTP_PASS=" .env; then
    echo "📧 Gmail credentials found, starting Gmail integration..."
    start_gmail_integration
else
    echo "⚠️  Gmail credentials not found in .env file"
fi

# Optional: Start backend server if it exists
if [ -d "server" ]; then
    echo "🔧 Backend directory found, starting backend server..."
    start_backend_server
else
    echo "ℹ️  No backend directory found, skipping backend server"
fi

# Summary
echo ""
echo "============================================"
echo "🎉 Productivity Hub Startup Complete!"
echo "============================================"
echo "📱 Frontend: http://localhost:5173"
echo "📧 Gmail: http://localhost:8080 (if enabled)"
echo "🔧 Backend: http://localhost:3001 (if enabled)"
echo ""
echo "🔍 To check running processes:"
echo "   ps aux | grep -E '(node|vite)' | grep -v grep"
echo ""
echo "🛑 To stop all services:"
echo "   pkill -f 'node.*chat-ac5267c7' || pkill -f 'vite'"
echo ""
echo "📋 Process IDs saved for reference:"
echo "   - Dev Server PID: $DEV_PID"
[ ! -z "$GMAIL_PID" ] && echo "   - Gmail PID: $GMAIL_PID"
[ ! -z "$BACKEND_PID" ] && echo "   - Backend PID: $BACKEND_PID"
echo ""

# Keep the script running to allow for monitoring
echo "Press Ctrl+C to stop all services..."
trap 'echo "🛑 Stopping all services..."; pkill -f "node.*chat-ac5267c7" || pkill -f "vite"; exit 0' INT

# Monitor processes
while true; do
    sleep 30
    echo "⏰ $(date): All services running normally..."
done