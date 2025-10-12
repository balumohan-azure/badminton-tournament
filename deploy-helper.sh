#!/bin/bash

# Badminton Tournament App - Deployment Helper Script
# This script helps you deploy your app to GitHub Pages + Render

echo "🏸 Badminton Tournament App - Deployment Helper"
echo "=============================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not initialized. Please run:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    exit 1
fi

# Check if remote origin is set
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ No remote origin set. Please run:"
    echo "   git remote add origin https://github.com/yourusername/badminton-tournament.git"
    exit 1
fi

echo "✅ Git repository is ready"

# Check if GitHub Actions workflow exists
if [ ! -f ".github/workflows/deploy.yml" ]; then
    echo "❌ GitHub Actions workflow not found. Please ensure deploy.yml exists."
    exit 1
fi

echo "✅ GitHub Actions workflow found"

# Check if homepage is set correctly
if ! grep -q "homepage" package.json; then
    echo "❌ Homepage not set in package.json. Please update with your GitHub username."
    exit 1
fi

echo "✅ Homepage configuration found"

# Check if API service uses environment variables
if ! grep -q "process.env.REACT_APP_API_URL" client/src/services/api.ts; then
    echo "❌ API service not configured for production. Please update api.ts."
    exit 1
fi

echo "✅ API service configured for production"

echo ""
echo "🚀 Ready to deploy! Next steps:"
echo "1. Update homepage URLs in package.json files with your GitHub username"
echo "2. Push to GitHub: git push origin main"
echo "3. Set up Render backend deployment (render.yaml configured)"
echo "4. Add REACT_APP_API_URL secret in GitHub repository settings"
echo "5. Enable GitHub Pages in repository settings"
echo ""
echo "📖 See DEPLOYMENT_GITHUB_PAGES_RENDER.md for detailed instructions"
echo ""
echo "⚠️  Note: Render free tier has sleep mode (15 min inactivity)"
echo "   First request after sleep takes ~30 seconds"

# Optional: Test build locally
read -p "Would you like to test the build locally? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔨 Testing build..."
    cd client
    if npm run build; then
        echo "✅ Build successful!"
        echo "🌐 You can test locally with: npx serve -s build"
    else
        echo "❌ Build failed. Please check the errors above."
    fi
    cd ..
fi

echo ""
echo "🎉 Deployment setup complete!"
