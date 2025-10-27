#!/bin/bash

# Process Cleanup Script for Analytics Dashboard
# This script helps clean up conflicting background processes

echo "🧹 Cleaning up background processes..."

# Kill processes on common ports used by the application
echo "📧 Cleaning up Gmail IMAP server (port 3012)..."
lsof -ti:3012 | xargs kill -9 2>/dev/null || echo "No process found on port 3012"

echo "👥 Cleaning up CardDAV bridge (port 3014)..."
lsof -ti:3014 | xargs kill -9 2>/dev/null || echo "No process found on port 3014"

echo "🌐 Cleaning up OAuth server (port 3006)..."
lsof -ti:3006 | xargs kill -9 2>/dev/null || echo "No process found on port 3006"

echo "🚀 Cleaning up frontend dev server (port 5176)..."
lsof -ti:5176 | xargs kill -9 2>/dev/null || echo "No process found on port 5176"

# Kill any remaining Node.js processes that might be related
echo "🔍 Cleaning up any remaining Node.js processes..."
pkill -f "gmail-imap-server.cjs" 2>/dev/null || echo "No Gmail IMAP server processes found"
pkill -f "carddav-bridge" 2>/dev/null || echo "No CardDAV bridge processes found"
pkill -f "oauth-server" 2>/dev/null || echo "No OAuth server processes found"
pkill -f "vite" 2>/dev/null || echo "No Vite processes found"

# Wait a moment for processes to fully terminate
sleep 2

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Start Gmail IMAP server: node gmail-imap-server.cjs"
echo "2. Start CardDAV bridge: node carddav-bridge.cjs"
echo "3. Start frontend: npm run dev"
echo ""
echo "🌐 Frontend will be available at: http://localhost:5176"
echo "📧 Gmail API: http://localhost:3012"
echo "👥 CardDAV API: http://localhost:3014"
echo "🔐 OAuth server: http://localhost:3006"