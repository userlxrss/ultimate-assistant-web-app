#!/bin/bash

# Emergency Cleanup Script - Clean Development Environment
# Kills ALL conflicting Node.js processes and starts clean services

echo "🚨 EMERGENCY CLEANUP - Killing all conflicting processes..."
echo "========================================================"

# Change to project directory
cd /Users/larstuesca/Documents/agent-girl/chat-ac5267c7

# 1. KILL ALL PROCESSES FORCEFULLY
echo "🔥 Force killing all Node.js processes on conflict ports..."

# Kill processes on specific ports
lsof -ti:5173,5174,5175,5176,5181,3012,3013,3000,3001,3002,8000,8080 | xargs kill -9 2>/dev/null || true

# Kill by process name patterns
pkill -f "vite" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true
pkill -f "node.*gmail" 2>/dev/null || true
pkill -f "node.*carddav" 2>/dev/null || true
pkill -f "node.*motion" 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true
pkill -f "node.*bridge" 2>/dev/null || true
pkill -f "node.*oauth" 2>/dev/null || true

# Kill any remaining processes in this project directory
pkill -f "chat-ac5267c7" 2>/dev/null || true

echo "✅ All processes killed"

# 2. WAIT FOR CLEANUP
echo "⏳ Waiting for processes to fully terminate..."
sleep 3

# 3. VERIFY PORTS ARE FREE
echo "🔍 Verifying ports are free..."
for port in 5173 3012 3013; do
    if lsof -i :$port >/dev/null 2>&1; then
        echo "⚠️  Port $port is still in use, killing again..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
    else
        echo "✅ Port $port is free"
    fi
done

# 4. START CLEAN ENVIRONMENT
echo ""
echo "🚀 Starting clean development environment..."
echo "=========================================="

# Function to check if port is in use
wait_for_port() {
    local port=$1
    local service=$2
    local timeout=10
    local count=0

    while [ $count -lt $timeout ]; do
        if lsof -i :$port >/dev/null 2>&1; then
            echo "✅ $service is running on port $port"
            return 0
        fi
        sleep 1
        count=$((count + 1))
    done
    echo "⚠️  $service may not be responding on port $port"
    return 1
}

# Start main web app (Vite dev server)
echo "🌐 Starting main web app on port 5173..."
npm run dev > /tmp/vite.log 2>&1 &
VITE_PID=$!
echo "✅ Vite dev server started with PID: $VITE_PID"

# Wait for Vite to start
sleep 3
wait_for_port 5173 "Vite Dev Server"

# Start Motion API proxy (port 3013)
echo "🔄 Starting Motion API proxy on port 3013..."
node simple-motion-server.cjs > /tmp/motion.log 2>&1 &
MOTION_PID=$!
echo "✅ Motion API proxy started with PID: $MOTION_PID"

# Wait for Motion API to start
sleep 2
wait_for_port 3013 "Motion API Proxy"

# Start Gmail IMAP server (port 3012) - only if .env has credentials
if [ -f ".env" ] && grep -q "SMTP_USER=" .env && grep -q "SMTP_PASS=" .env; then
    echo "📧 Starting Gmail IMAP server on port 3012..."
    node gmail-imap-server.cjs > /tmp/gmail.log 2>&1 &
    GMAIL_PID=$!
    echo "✅ Gmail IMAP server started with PID: $GMAIL_PID"

    # Wait for Gmail server to start
    sleep 2
    wait_for_port 3012 "Gmail IMAP Server"
else
    echo "⚠️  Gmail credentials not found, skipping Gmail server"
    GMAIL_PID=""
fi

# 5. FINAL VERIFICATION
echo ""
echo "🔍 Final verification of services..."
echo "===================================="

# Check if all services are responding
echo "Checking services..."
curl -s http://localhost:5173 >/dev/null 2>&1 && echo "✅ Frontend (5173): RESPONDING" || echo "❌ Frontend (5173): NOT RESPONDING"
curl -s http://localhost:3013/api/motion/health >/dev/null 2>&1 && echo "✅ Motion API (3013): RESPONDING" || echo "⚠️  Motion API (3013): Starting..."

if [ ! -z "$GMAIL_PID" ]; then
    curl -s http://localhost:3012/health >/dev/null 2>&1 && echo "✅ Gmail Server (3012): RESPONDING" || echo "⚠️  Gmail Server (3012): Starting..."
fi

# 6. SUMMARY
echo ""
echo "🎉 CLEAN DEVELOPMENT ENVIRONMENT STARTED!"
echo "=========================================="
echo "📱 Frontend:      http://localhost:5173"
echo "🔄 Motion API:    http://localhost:3013"
echo "📧 Gmail Server:  http://localhost:3012 (if enabled)"
echo ""
echo "📋 Process IDs:"
echo "   - Vite (5173):     $VITE_PID"
[ ! -z "$MOTION_PID" ] && echo "   - Motion (3013):   $MOTION_PID"
[ ! -z "$GMAIL_PID" ] && echo "   - Gmail (3012):    $GMAIL_PID"
echo ""
echo "📝 Logs:"
echo "   - Vite:   tail -f /tmp/vite.log"
echo "   - Motion: tail -f /tmp/motion.log"
[ ! -z "$GMAIL_PID" ] && echo "   - Gmail:  tail -f /tmp/gmail.log"
echo ""
echo "🛑 To stop all services:"
echo "   ./emergency-cleanup.sh stop"
echo ""
echo "🔍 To check running processes:"
echo "   ps aux | grep -E '(vite|node.*3012|node.*3013)' | grep -v grep"
echo ""

# Handle stop command
if [ "$1" == "stop" ]; then
    echo "🛑 Stopping all services..."
    pkill -f "vite" 2>/dev/null || true
    pkill -f "simple-motion-server" 2>/dev/null || true
    pkill -f "gmail-imap-server" 2>/dev/null || true
    lsof -ti:5173,3012,3013 | xargs kill -9 2>/dev/null || true
    echo "✅ All services stopped"
    exit 0
fi

# Keep script running to monitor services
echo "Press Ctrl+C to stop all services..."
trap 'echo "🛑 Stopping all services..."; pkill -f "vite" 2>/dev/null || true; pkill -f "simple-motion-server" 2>/dev/null || true; pkill -f "gmail-imap-server" 2>/dev/null || true; lsof -ti:5173,3012,3013 | xargs kill -9 2>/dev/null || true; echo "✅ All services stopped"; exit 0' INT

# Monitor services every 30 seconds
while true; do
    sleep 30
    echo "⏰ $(date): All services monitored - running normally..."
done