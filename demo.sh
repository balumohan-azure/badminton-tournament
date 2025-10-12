#!/bin/bash

echo "🏸 Badminton Tournament Manager - Demo Mode"
echo "=========================================="

# Check if .env exists
if [ ! -f "server/.env" ]; then
    echo "⚠️  No .env file found. Creating demo environment..."
    echo "GEMINI_API_KEY=demo_key_for_testing" > server/.env
    echo "PORT=5000" >> server/.env
    echo "NODE_ENV=development" >> server/.env
    echo "✅ Demo environment created"
fi

echo "🚀 Starting the application in demo mode..."
echo "📝 Note: AI features will use fallback logic without a real API key"
echo ""

# Start the application
npm run dev

