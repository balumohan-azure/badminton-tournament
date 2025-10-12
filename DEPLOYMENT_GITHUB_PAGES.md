# 🚀 Badminton Tournament App - GitHub Pages + Railway Deployment Guide

## Overview
This guide will help you deploy your badminton tournament app using:
- **Frontend**: GitHub Pages (free, automatic deployment)
- **Backend**: Railway (free tier available)

## Prerequisites
- GitHub account
- Railway account (free)
- Google Gemini API key

## Deployment Architecture
```
Frontend (React) → GitHub Pages
Backend (Node.js) → Railway
```

## Step 1: Prepare Your Repository

### 1.1 Push to GitHub
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Add GitHub Pages deployment configuration"
git branch -M main
git remote add origin https://github.com/yourusername/badminton-tournament.git
git push -u origin main
```

### 1.2 Update Repository Settings
1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. The workflow will automatically deploy your app

## Step 2: Deploy Backend to Railway

### 2.1 Create Railway Project
1. Go to [Railway.app](https://railway.app)
2. Sign up/login with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose your badminton tournament repository
6. **Important**: Set the root directory to `server` (not the root)

### 2.2 Configure Environment Variables
In Railway dashboard, go to your project → **Variables** tab and add:
```
GEMINI_API_KEY=your_actual_gemini_api_key
PORT=5000
NODE_ENV=production
```

### 2.3 Deploy
Railway will automatically deploy your backend. Note the generated URL (e.g., `https://your-app-name.railway.app`)

## Step 3: Configure GitHub Pages

### 3.1 Set Repository Secrets
1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add the following secret:
   - **Name**: `REACT_APP_API_URL`
   - **Value**: `https://your-app-name.railway.app/api`

### 3.2 Enable GitHub Pages
1. Go to **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. The workflow will automatically deploy when you push to main

## Step 4: Update Configuration Files

### 4.1 Update Homepage URLs
Replace `yourusername` with your actual GitHub username in:
- `package.json` (line 5)
- `client/package.json` (line 5)

### 4.2 Test Local Build
```bash
# Test the production build locally
cd client
REACT_APP_API_URL=https://your-app-name.railway.app/api npm run build
npx serve -s build
```

## Step 5: Deploy and Test

### 5.1 Trigger Deployment
```bash
# Push any changes to trigger GitHub Actions
git add .
git commit -m "Update deployment configuration"
git push origin main
```

### 5.2 Monitor Deployment
1. Go to your GitHub repository
2. Click **Actions** tab
3. Watch the deployment progress
4. Check Railway logs for backend deployment

### 5.3 Test Your App
1. Visit: `https://yourusername.github.io/badminton-tournament`
2. Add some players
3. Create a tournament
4. Verify AI team creation works
5. Test score entry and results

## Step 6: Update CORS Settings

If you encounter CORS issues, update your server's CORS configuration:

```javascript
// In server/index.js, update the CORS configuration
app.use(cors({
  origin: [
    'https://yourusername.github.io',
    'http://localhost:3000'
  ],
  credentials: true
}));
```

## Alternative: Render Backend Deployment

If you prefer Render over Railway:

### Render Setup
1. Go to [Render.com](https://render.com)
2. Sign up/login with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repository
5. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Add environment variables:
   - `GEMINI_API_KEY`
   - `NODE_ENV=production`

## Environment Variables Reference

### Frontend (GitHub Actions)
```
REACT_APP_API_URL=https://your-backend-url.railway.app/api
```

### Backend (Railway/Render)
```
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
NODE_ENV=production
```

## Troubleshooting

### Common Issues

1. **GitHub Pages Not Updating**
   - Check GitHub Actions workflow status
   - Verify repository secrets are set correctly
   - Ensure homepage URL is correct

2. **CORS Errors**
   - Update CORS origin in server/index.js
   - Ensure GitHub Pages URL is whitelisted

3. **API Connection Issues**
   - Verify REACT_APP_API_URL secret is set correctly
   - Check backend is running and accessible
   - Test backend URL directly in browser

4. **Build Failures**
   - Check GitHub Actions logs
   - Verify Node.js version compatibility
   - Ensure all dependencies are installed

5. **Railway Deployment Issues**
   - Check Railway logs: Project → Deployments → View Logs
   - Verify environment variables are set
   - Ensure root directory is set to `server`

### Getting Help
- **GitHub Actions**: Check Actions tab for detailed logs
- **Railway**: Check project logs and deployment status
- **Render**: Check service logs and build logs

## Cost Estimation

### Free Tier Limits
- **GitHub Pages**: Free for public repositories
- **Railway**: $5 credit/month (usually enough for small apps)
- **Render**: Free tier available (with limitations)
- **Total**: ~$0-5/month for small to medium usage

## Security Considerations

1. **API Keys**: Never commit API keys to GitHub
2. **CORS**: Restrict origins to your production domains
3. **Environment Variables**: Use platform-specific secret management
4. **HTTPS**: Both GitHub Pages and Railway use HTTPS by default

## Monitoring & Maintenance

1. **Monitor Usage**: Check Railway usage dashboard
2. **Update Dependencies**: Regularly update npm packages
3. **Backup Data**: Consider adding database persistence for production
4. **Monitor Deployments**: Check GitHub Actions and Railway logs regularly

## Quick Commands

```bash
# Local development
npm run dev

# Build for production
npm run build

# Test production build locally
cd client && npm run build && npx serve -s build

# Deploy (push to main)
git add . && git commit -m "Deploy update" && git push origin main
```

## File Structure After Deployment

```
your-repo/
├── .github/workflows/deploy.yml    # GitHub Actions workflow
├── client/                         # React frontend
├── server/                         # Node.js backend
├── nixpacks.toml                   # Railway configuration
├── package.json                    # Root package.json
└── DEPLOYMENT.md                   # This guide
```

---

## 🎉 You're All Set!

Your badminton tournament app will be available at:
- **Frontend**: `https://yourusername.github.io/badminton-tournament`
- **Backend**: `https://your-app-name.railway.app`

The app will automatically redeploy whenever you push changes to the main branch! 🏸
