#!/bin/bash

# EMERGENCY PROCESS KILLER - Nuclear option for zombie processes
# Use only when system is overwhelmed with background processes

echo "🚨 EMERGENCY PROCESS KILLER - NUCLEAR OPTION"
echo "============================================="
echo "This will kill ALL development-related processes!"
echo ""

read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted."
    exit 1
fi

echo "🔥 INITIATING EMERGENCY CLEANUP..."

# Kill all development processes by pattern
echo "🎯 Killing Vite processes..."
pkill -f "node.*vite" 2>/dev/null || echo "No Vite processes found"

echo "🎯 Killing npm dev processes..."
pkill -f "npm.*dev" 2>/dev/null || echo "No npm dev processes found"

echo "🎯 Killing OAuth servers..."
pkill -f "simple-oauth-server" 2>/dev/null || echo "No OAuth servers found"

echo "🎯 Killing esbuild processes..."
pkill -f "esbuild" 2>/dev/null || echo "No esbuild processes found"

echo "🎯 Killing Node.js servers in project directory..."
pkill -f "chat-ac5267c7" 2>/dev/null || echo "No project processes found"

# Force kill any remaining processes on common ports
echo "🎯 Force killing processes on development ports..."
for port in 3000 3001 3002 3003 3004 3005 3006 5173 8080; do
    pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo "  Killing process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null
    fi
done

sleep 3

echo ""
echo "✅ EMERGENCY CLEANUP COMPLETED"
echo ""

# Verify cleanup
echo "📊 Remaining processes:"
ps aux | grep -E "(node|npm|vite)" | grep -v grep | wc -l | xargs echo "  Total Node-related processes:"

echo ""
echo "🌐 Port status:"
for port in 3000 3001 3002 3003 3004 3005 3006 5173 8080; do
    if lsof -i :$port >/dev/null 2>&1; then
        echo "  🔴 Port $port: STILL IN USE"
    else
        echo "  ✅ Port $port: CLEARED"
    fi
done

echo ""
echo "💾 System is now clean. You can restart your development servers."
echo "   OAuth:    cd server && PORT=3006 node simple-oauth-server.cjs"
echo "   React:    npm run dev"