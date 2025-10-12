#!/bin/bash

echo "🏸 Badminton Tournament Manager Setup"
echo "====================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm run install-all

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Check for .env file
if [ ! -f "server/.env" ]; then
    echo "⚠️  No .env file found in server directory"
    echo "📝 Creating .env file from template..."
    cp server/env.example server/.env
    echo "🔑 Please edit server/.env and add your Gemini API key"
    echo "   Get your API key from: https://makersuite.google.com/app/apikey"
fi

echo ""
echo "🚀 Setup complete! To start the application:"
echo "   npm run dev"
echo ""
echo "📖 For detailed instructions, see README.md"

