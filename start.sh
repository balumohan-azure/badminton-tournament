#!/bin/bash

echo "🏸 Badminton Tournament Manager"
echo "==============================="
echo ""
echo "Starting the application..."
echo ""

# Check if .env exists
if [ ! -f "server/.env" ]; then
    echo "⚠️  Creating demo environment file..."
    echo "GEMINI_API_KEY=demo_key_for_testing" > server/.env
    echo "PORT=5000" >> server/.env
    echo "NODE_ENV=development" >> server/.env
    echo "✅ Demo environment created"
    echo ""
fi

echo "🚀 Starting both frontend and backend..."
echo "📱 Frontend will be available at: http://localhost:3000"
echo "🔧 Backend API will be available at: http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop the application"
echo ""

npm run dev

