# 🚀 Badminton Tournament App - GitHub Pages + Render Deployment Guide

## Overview
This guide will help you deploy your badminton tournament app using:
- **Frontend**: GitHub Pages (free, automatic deployment)
- **Backend**: Render (free tier available)

## Prerequisites
- GitHub account
- Render account (free)
- Google Gemini API key

## Deployment Architecture
```
Frontend (React) → GitHub Pages
Backend (Node.js) → Render
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

## Step 2: Deploy Backend to Render

### 2.1 Create Render Account
1. Go to [Render.com](https://render.com)
2. Sign up/login with GitHub
3. Click **"New +"** → **"Web Service"**

### 2.2 Connect Repository
1. Select **"Build and deploy from a Git repository"**
2. Connect your GitHub account
3. Choose your badminton tournament repository
4. **Important**: Set the **Root Directory** to `server`

### 2.3 Configure Service Settings
```
Name: badminton-tournament-backend
Environment: Node
Region: Oregon (US West) or Frankfurt (EU)
Branch: main
Root Directory: server
Build Command: npm install
Start Command: npm start
```

### 2.4 Set Environment Variables
In Render dashboard, go to your service → **Environment** tab and add:
```
GEMINI_API_KEY=your_actual_gemini_api_key
NODE_ENV=production
PORT=10000
```

### 2.5 Deploy
Click **"Create Web Service"**. Render will automatically deploy your backend. Note the generated URL (e.g., `https://badminton-tournament-backend.onrender.com`)

## Step 3: Configure GitHub Pages

### 3.1 Set Repository Secrets
1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add the following secret:
   - **Name**: `REACT_APP_API_URL`
   - **Value**: `https://your-render-app.onrender.com/api`

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
REACT_APP_API_URL=https://your-render-app.onrender.com/api npm run build
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
4. Check Render logs for backend deployment

### 5.3 Test Your App
1. Visit: `https://yourusername.github.io/badminton-tournament`
2. Add some players
3. Create a tournament
4. Verify AI team creation works
5. Test score entry and results

## Step 6: Update CORS Settings

Update your server's CORS configuration for Render:

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

## Render Free Tier Limitations

### Important Notes
- **Sleep Mode**: Free tier services sleep after 15 minutes of inactivity
- **Cold Start**: First request after sleep takes ~30 seconds
- **Bandwidth**: 100GB/month
- **Build Time**: 90 minutes/month

### Keeping Service Active
To prevent sleep mode, you can:
1. Use a service like UptimeRobot to ping your app every 14 minutes
2. Upgrade to paid plan ($7/month) for always-on service

## Environment Variables Reference

### Frontend (GitHub Actions)
```
REACT_APP_API_URL=https://your-render-app.onrender.com/api
```

### Backend (Render)
```
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=production
PORT=10000
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
   - **Note**: First request after sleep may take 30 seconds

4. **Build Failures**
   - Check GitHub Actions logs
   - Verify Node.js version compatibility
   - Ensure all dependencies are installed

5. **Render Deployment Issues**
   - Check Render service logs
   - Verify environment variables are set
   - Ensure root directory is set to `server`
   - Check if service is sleeping (cold start delay)

### Getting Help
- **GitHub Actions**: Check Actions tab for detailed logs
- **Render**: Check service logs and deployment status
- **Render Support**: Free tier includes community support

## Cost Estimation

### Free Tier Limits
- **GitHub Pages**: Free for public repositories
- **Render**: Free tier with sleep mode
- **Total**: $0/month (with sleep mode limitations)

### Paid Option
- **Render**: $7/month for always-on service
- **Total**: $7/month for production-ready deployment

## Security Considerations

1. **API Keys**: Never commit API keys to GitHub
2. **CORS**: Restrict origins to your production domains
3. **Environment Variables**: Use platform-specific secret management
4. **HTTPS**: Both GitHub Pages and Render use HTTPS by default

## Monitoring & Maintenance

1. **Monitor Usage**: Check Render usage dashboard
2. **Update Dependencies**: Regularly update npm packages
3. **Backup Data**: Consider adding database persistence for production
4. **Monitor Deployments**: Check GitHub Actions and Render logs regularly
5. **Sleep Mode**: Monitor service uptime and consider upgrade if needed

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
├── render.yaml                     # Render configuration
├── package.json                    # Root package.json
└── DEPLOYMENT_GITHUB_PAGES.md      # This guide
```

## Render vs Railway Comparison

| Feature | Render Free | Railway Free |
|---------|-------------|--------------|
| Sleep Mode | Yes (15 min) | No |
| Cold Start | ~30 seconds | Instant |
| Bandwidth | 100GB/month | $5 credit |
| Build Time | 90 min/month | Unlimited |
| Always On | $7/month | $5/month |

---

## 🎉 You're All Set!

Your badminton tournament app will be available at:
- **Frontend**: `https://yourusername.github.io/badminton-tournament`
- **Backend**: `https://your-render-app.onrender.com`

The app will automatically redeploy whenever you push changes to the main branch! 

**Note**: Due to Render's free tier sleep mode, the first request after inactivity may take ~30 seconds to respond. 🏸
