#!/bin/bash

echo "🚀 Starting Mobile Development Environment..."
echo ""

# Check if dev server is already running
if lsof -Pi :9002 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Dev server already running on port 9002"
else
    echo "⚡ Starting dev server..."
    npm run dev &
    sleep 5
fi

# Get current IP
CURRENT_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
echo ""
echo "📱 Your dev server is accessible at:"
echo "   http://$CURRENT_IP:9002"
echo ""

# Sync to Android
echo "🔄 Syncing to Android..."
npx cap sync android

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Open Android Studio: npx cap open android"
echo "2. Click Run ▶️"
echo "3. Your app will connect to: http://$CURRENT_IP:9002"
echo ""
echo "💡 Keep this terminal open while developing!"
