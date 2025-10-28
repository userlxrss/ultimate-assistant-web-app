#!/bin/bash

# Quick Status Check Script
# Shows what's running and identifies conflicts

echo "🔍 DEVELOPMENT ENVIRONMENT STATUS CHECK"
echo "======================================="

cd /Users/larstuesca/Documents/agent-girl/chat-ac5267c7

echo ""
echo "📡 PORTS IN USE:"
echo "-----------------"
for port in 5173 5174 5175 3012 3013 3000 3001 8000 8080; do
    if lsof -i :$port >/dev/null 2>&1; then
        process=$(lsof -i :$port | tail -n 1 | awk '{print $1}')
        pid=$(lsof -i :$port | tail -n 1 | awk '{print $2}')
        echo "🔴 Port $port: $process (PID: $pid)"
    else
        echo "✅ Port $port: Free"
    fi
done

echo ""
echo "⚡ ACTIVE NODE PROCESSES:"
echo "-------------------------"
ps aux | grep -E "(node|npm|vite)" | grep -v grep | grep -E "(5173|3012|3013|gmail|motion|carddav|server)" | while read line; do
    pid=$(echo $line | awk '{print $2}')
    cmd=$(echo $line | awk '{print substr($0, index($0,$11))}')
    echo "🟢 PID $pid: $cmd"
done

echo ""
echo "🔥 CONFLICTING PROCESSES TO KILL:"
echo "---------------------------------"
conflicts=false

# Check for vite processes
if pgrep -f "vite" >/dev/null; then
    echo "🔥 Vite processes found:"
    pgrep -f "vite" | while read pid; do
        cmd=$(ps -p $pid -o command=)
        echo "   - PID $pid: $cmd"
    done
    conflicts=true
fi

# Check for node servers on project ports
if pgrep -f "node.*3012\|node.*3013\|node.*gmail\|node.*motion" >/dev/null; then
    echo "🔥 Node server processes found:"
    pgrep -f "node.*3012\|node.*3013\|node.*gmail\|node.*motion" | while read pid; do
        cmd=$(ps -p $pid -o command=)
        echo "   - PID $pid: $cmd"
    done
    conflicts=true
fi

if [ "$conflicts" = false ]; then
    echo "✅ No conflicting processes found"
fi

echo ""
echo "🌐 SERVICE HEALTH CHECK:"
echo "------------------------"

# Check frontend
if curl -s http://localhost:5173 >/dev/null 2>&1; then
    echo "✅ Frontend (5173): RESPONDING"
else
    echo "❌ Frontend (5173): NOT RESPONDING"
fi

# Check Motion API
if curl -s http://localhost:3013 >/dev/null 2>&1; then
    echo "✅ Motion API (3013): RESPONDING"
else
    echo "❌ Motion API (3013): NOT RESPONDING"
fi

# Check Gmail Server
if curl -s http://localhost:3012 >/dev/null 2>&1; then
    echo "✅ Gmail Server (3012): RESPONDING"
else
    echo "❌ Gmail Server (3012): NOT RESPONDING"
fi

echo ""
echo "🧹 QUICK CLEANUP COMMANDS:"
echo "---------------------------"
echo "# Kill all conflicting processes:"
echo "lsof -ti:5173,5174,5175,3012,3013 | xargs kill -9"
echo ""
echo "# Kill by process name:"
echo "pkill -f 'vite|npm.*dev|node.*gmail|node.*motion|node.*server'"
echo ""
echo "# Run emergency cleanup:"
echo "./emergency-cleanup.sh"

echo ""
echo "🚀 START CLEAN ENVIRONMENT:"
echo "--------------------------"
echo "./emergency-cleanup.sh"