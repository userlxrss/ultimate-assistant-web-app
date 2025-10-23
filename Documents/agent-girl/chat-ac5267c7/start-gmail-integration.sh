#!/bin/bash

# 🚀 Real Gmail Integration Startup Script
# Career-Critical Gmail IMAP/SMTP Setup

echo "🔧 Starting Real Gmail Integration for Career Productivity..."
echo ""

# Check if we're in the right directory
if [ ! -f "gmail-imap-server.cjs" ]; then
    echo "❌ Error: gmail-imap-server.cjs not found!"
    echo "Please run this script from the project directory:"
    echo "cd /Users/larstuesca/Documents/agent-girl/chat-ac5267c7"
    exit 1
fi

echo "✅ Found Gmail IMAP server configuration"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed!"
    echo "Please install Node.js first: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js is available"

# Check if required dependencies are installed
echo "📦 Checking dependencies..."
if ! node -e "require('emailjs-imap-client')" 2>/dev/null; then
    echo "📦 Installing emailjs-imap-client..."
    npm install emailjs-imap-client
fi

if ! node -e "require('mailparser')" 2>/dev/null; then
    echo "📦 Installing mailparser..."
    npm install mailparser
fi

if ! node -e "require('nodemailer')" 2>/dev/null; then
    echo "📦 Installing nodemailer..."
    npm install nodemailer
fi

echo "✅ All dependencies are ready"

# Check if the Gmail IMAP server is already running
if curl -s http://localhost:3012/health > /dev/null 2>&1; then
    echo "✅ Gmail IMAP server is already running on port 3012"
else
    echo "🚀 Starting Gmail IMAP server on port 3012..."
    node gmail-imap-server.cjs &
    GMAIL_PID=$!

    # Wait a moment for server to start
    sleep 3

    # Check if server started successfully
    if curl -s http://localhost:3012/health > /dev/null 2>&1; then
        echo "✅ Gmail IMAP server started successfully (PID: $GMAIL_PID)"
    else
        echo "❌ Failed to start Gmail IMAP server"
        exit 1
    fi
fi

# Check if the web app is running
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Web app is already running on port 5173"
else
    echo "🌐 Starting web app on port 5173..."
    npm run dev &
    WEB_PID=$!

    # Wait a moment for web app to start
    sleep 5

    # Check if web app started successfully
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "✅ Web app started successfully (PID: $WEB_PID)"
    else
        echo "⚠️  Web app may still be starting..."
    fi
fi

echo ""
echo "🎉 Real Gmail Integration is Ready!"
echo ""
echo "📧 Gmail IMAP Server: http://localhost:3012"
echo "🌐 Web Application:   http://localhost:5173"
echo ""
echo "📋 Next Steps:"
echo "1. Open http://localhost:5173 in your browser"
echo "2. Navigate to the Email tab"
echo "3. Enter your Gmail: tuescalarina3@gmail.com"
echo "4. Enter your 16-digit App Password"
echo "5. Click 'Connect Gmail'"
echo "6. Enjoy real Gmail integration!"
echo ""
echo "🔒 Security Note:"
echo "Your App Password is used only for IMAP/SMTP authentication"
echo "and is never stored permanently."
echo ""
echo "🚀 Career-Critical Gmail Integration is now LIVE!"

# Keep the script running to maintain the servers
wait