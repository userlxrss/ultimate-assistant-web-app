#!/bin/bash

echo "🚀 Starting Ultimate Assistant Hub..."
echo "Finding available port..."

# Kill any existing Next.js processes
pkill -f "next dev" 2>/dev/null

# Try different ports
for port in 3000 3001 3010 4000 8000 8080 8081 9000; do
    if ! lsof -i :$port > /dev/null 2>&1; then
        echo "✅ Found available port: $port"
        echo "🌐 Starting app on http://localhost:$port"
        npm run dev -- -p $port
        break
    fi
done

if [ $? -ne 0 ]; then
    echo "❌ Could not find an available port. Please check your network settings."
    echo "💡 You can still edit the source files directly:"
    echo "   📂 /Users/larstuesca/Documents/agent-girl/chat-00da1e6f/src/"
fi