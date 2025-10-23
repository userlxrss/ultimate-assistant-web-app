#!/bin/bash

# Process Monitor - Prevents zombie process accumulation
# Usage: ./scripts/process-monitor.sh

echo "🔍 PROCESS MONITOR - Preventing zombie process accumulation..."
echo "============================================================"

# Check for development-related processes
echo "📊 Current development processes:"
ps aux | grep -E "(node.*vite|npm.*dev|simple-oauth-server)" | grep -v grep || echo "✅ No development processes found"

echo ""

# Count processes related to this project
PROJECT_PROCESSES=$(ps aux | grep -E "(chat-ac5267c7|agent-girl)" | grep -v grep | wc -l)
echo "📈 Project-related processes: $PROJECT_PROCESSES"

if [ $PROJECT_PROCESSES -gt 4 ]; then
    echo "⚠️  WARNING: Too many project processes detected!"
    echo "🔥 EMERGENCY CLEANUP INITIATED..."

    # Kill all development processes aggressively
    pkill -f "node.*vite" 2>/dev/null
    pkill -f "npm.*dev" 2>/dev/null
    pkill -f "simple-oauth-server" 2>/dev/null
    pkill -f "esbuild" 2>/dev/null

    sleep 2

    echo "✅ Cleanup completed. Process count: $(ps aux | grep -E '(chat-ac5267c7|agent-girl)' | grep -v grep | wc -l)"
else
    echo "✅ Process count is healthy"
fi

echo ""

# Check port usage
echo "🌐 Port usage:"
for port in 3000 3001 3002 3003 3004 3005 3006 5173 8080; do
    if lsof -i :$port >/dev/null 2>&1; then
        echo "  🟢 Port $port: IN USE"
    else
        echo "  ⚪ Port $port: FREE"
    fi
done

echo ""

# System load
echo "💻 System load:"
top -l 1 | head -4 | tail -1

echo ""
echo "============================================================"
echo "✅ Process monitor completed"