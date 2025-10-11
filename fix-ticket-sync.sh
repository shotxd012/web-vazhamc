#!/bin/bash

echo "🔧 Discord Ticket Sync Fix Script"
echo "=================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

echo "✅ .env file found"

# Check for required env variables
if ! grep -q "DISCORD_TOKEN" .env; then
    echo "❌ DISCORD_TOKEN not found in .env"
    exit 1
fi

echo "✅ DISCORD_TOKEN configured"

# Check if MESSAGE_CONTENT intent is mentioned
echo ""
echo "⚠️  IMPORTANT: Check Discord Developer Portal"
echo "   https://discord.com/developers/applications"
echo "   → Your Application → Bot → Privileged Gateway Intents"
echo "   → Enable: MESSAGE CONTENT INTENT ✅"
echo ""
read -p "Press Enter when you've enabled MESSAGE CONTENT INTENT..."

# Stop all processes
echo ""
echo "🛑 Stopping all processes..."
pm2 stop all 2>/dev/null || pkill -f "node app.js" || true

sleep 2

# Clear any stuck processes
echo "🧹 Cleaning up..."
pm2 delete all 2>/dev/null || true

sleep 1

# Start fresh
echo "🚀 Starting application..."
pm2 start app.js --name "web-app" || node app.js &

sleep 3

# Show logs
echo ""
echo "📋 Checking logs..."
pm2 logs --lines 20 || true

echo ""
echo "✅ Fix script completed!"
echo ""
echo "Next steps:"
echo "1. Create a test ticket on the website"
echo "2. Check Discord for the channel"
echo "3. Send a message in Discord - should see: 📨 Message detected"
echo "4. Check console logs: pm2 logs"
echo ""
echo "If still not working, run: node test-ticket-sync.js"
