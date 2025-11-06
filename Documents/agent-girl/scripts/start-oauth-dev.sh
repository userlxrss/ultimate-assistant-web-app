#!/bin/bash

# OAuth Development Environment Startup Script
# This script starts both the OAuth server and frontend development servers

echo "🚀 Starting OAuth Development Environment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Start the OAuth server
echo "📍 Starting OAuth server on port 3002..."
cd server
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found in server directory"
    echo "   Please copy server/.env.example to server/.env and configure your OAuth credentials"
fi

# Start server in background
node server.js &
SERVER_PID=$!
echo "✅ OAuth server started with PID: $SERVER_PID"

# Wait for server to be ready
echo "⏳ Waiting for OAuth server to be ready..."
sleep 3

# Test server health
if curl -s http://localhost:3002/health > /dev/null; then
    echo "✅ OAuth server is healthy and responding"
else
    echo "❌ OAuth server failed to start"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# Return to root directory
cd ..

# Start the frontend
echo "📍 Starting frontend development server..."
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend server started with PID: $FRONTEND_PID"

echo ""
echo "🎉 OAuth Development Environment is ready!"
echo ""
echo "📍 Services:"
echo "   • Frontend: http://localhost:5174"
echo "   • OAuth Server: http://localhost:3002"
echo "   • Health Check: http://localhost:3002/health"
echo ""
echo "🔧 Setup Instructions:"
echo "   1. Configure Google OAuth in server/.env"
echo "   2. Get Motion API key from app.usemotion.com"
echo "   3. Navigate to Settings tab to connect services"
echo ""
echo "📚 Documentation: OAUTH_SETUP_GUIDE.md"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $SERVER_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ All servers stopped"
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup INT

# Wait for user to stop
wait