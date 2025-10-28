#!/bin/bash

# Gmail OAuth Server Startup Script
# This script starts the Gmail OAuth proxy server required for email access

echo "🚀 Starting Gmail OAuth Proxy Server..."
echo "📍 Location: /Users/larstuesca/Documents/agent-girl/chat-ac5267c7/"
echo "🌐 Server will run on: http://localhost:3011"
echo ""

# Check if we're in the right directory
if [ ! -f "server/gmail-oauth-server.cjs" ]; then
    echo "❌ Error: Gmail OAuth server not found in server/ directory"
    echo "   Make sure you're running this script from the project root"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "   Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm dependencies are installed
if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing npm dependencies for Gmail OAuth server..."
    cd server
    npm install express cors googleapis express-session session-file-store
    cd ..
    echo "✅ Dependencies installed"
fi

# Create sessions directory if it doesn't exist
mkdir -p server/sessions

# Start the Gmail OAuth server
echo "🔐 Starting Gmail OAuth server with security features..."
echo "📊 Available endpoints:"
echo "   • GET  /health - Health check"
echo "   • GET  /auth/google - Start OAuth flow"
echo "   • GET  /auth/google/callback - OAuth callback"
echo "   • GET  /api/auth/status - Check auth status"
echo "   • GET  /api/gmail/emails - Get recent emails"
echo "   • POST /api/gmail/send - Send email"
echo "   • POST /api/auth/logout - Logout"
echo ""
echo "🔗 Once server is running, open your web app and:"
echo "   1. Navigate to the Email tab"
echo "   2. Click 'Connect Gmail Account'"
echo "   3. Sign in with tuescalarina3@gmail.com"
echo "   4. Grant permissions to read and send emails"
echo ""
echo "⏹️  Press Ctrl+C to stop the server"
echo "=================================="

# Start the server
cd server
node gmail-oauth-server.cjs