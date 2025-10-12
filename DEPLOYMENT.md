# 🚀 Badminton Tournament App - Deployment Guide

## Overview
This guide will help you deploy your badminton tournament app to production using Vercel (frontend) and Railway (backend).

## Prerequisites
- GitHub account
- Vercel account (free)
- Railway account (free)
- Google Gemini API key

## Deployment Architecture
```
Frontend (React) → Vercel
Backend (Node.js) → Railway
```

## Step 1: Prepare Your Repository

### 1.1 Push to GitHub
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/badminton-tournament.git
git push -u origin main
```

### 1.2 Update API Configuration
The API service has been updated to use environment variables. The frontend will automatically connect to your deployed backend.

## Step 2: Deploy Backend to Railway

### 2.1 Create Railway Project
1. Go to [Railway.app](https://railway.app)
2. Sign up/login with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your badminton tournament repository
6. Select the `server` folder as the root directory

### 2.2 Configure Environment Variables
In Railway dashboard, go to your project → Variables tab and add:
```
GEMINI_API_KEY=your_actual_gemini_api_key
PORT=5000
NODE_ENV=production
```

### 2.3 Deploy
Railway will automatically deploy your backend. Note the generated URL (e.g., `https://your-app-name.railway.app`)

## Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Project
1. Go to [Vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Set the root directory to `client`

### 3.2 Configure Environment Variables
In Vercel dashboard, go to your project → Settings → Environment Variables and add:
```
REACT_APP_API_URL=https://your-app-name.railway.app/api
```

### 3.3 Deploy
Click "Deploy" and Vercel will build and deploy your React app.

## Step 4: Update CORS Settings (if needed)

If you encounter CORS issues, update your server's CORS configuration:

```javascript
// In server/index.js, update the CORS configuration
app.use(cors({
  origin: ['https://your-vercel-app.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
```

## Step 5: Test Your Deployment

1. Visit your Vercel app URL
2. Add some players
3. Create a tournament
4. Verify AI team creation works
5. Test score entry and results

## Alternative Deployment Options

### Option A: Static Web App (GitHub Pages)
If you want a simpler deployment without backend:

1. Build the React app: `cd client && npm run build`
2. Deploy the `build` folder to GitHub Pages
3. **Limitations**: No AI features, no persistent data

### Option B: Full-Stack on Single Platform
- **Heroku**: Deploy both frontend and backend
- **Render**: Full-stack deployment
- **Netlify**: Frontend + serverless functions

## Environment Variables Reference

### Frontend (Vercel)
```
REACT_APP_API_URL=https://your-backend-url.railway.app/api
```

### Backend (Railway)
```
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
NODE_ENV=production
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Update CORS origin in server/index.js
   - Ensure frontend URL is whitelisted

2. **API Connection Issues**
   - Verify REACT_APP_API_URL is set correctly
   - Check backend is running and accessible

3. **AI Features Not Working**
   - Verify GEMINI_API_KEY is set correctly
   - Check API key permissions

4. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed

### Getting Help
- Check Railway logs: Project → Deployments → View Logs
- Check Vercel logs: Project → Functions → View Logs
- Verify environment variables are set correctly

## Cost Estimation

### Free Tier Limits
- **Vercel**: 100GB bandwidth/month, unlimited deployments
- **Railway**: $5 credit/month (usually enough for small apps)
- **Total**: ~$0-5/month for small to medium usage

## Security Considerations

1. **API Keys**: Never commit API keys to GitHub
2. **CORS**: Restrict origins to your production domains
3. **Environment Variables**: Use platform-specific secret management

## Monitoring & Maintenance

1. **Monitor Usage**: Check Railway usage dashboard
2. **Update Dependencies**: Regularly update npm packages
3. **Backup Data**: Consider adding database persistence for production

---

## Quick Start Commands

```bash
# Local development
npm run dev

# Build for production
npm run build

# Test production build locally
cd client && npm run build && npx serve -s build
```

Your badminton tournament app is now ready for production! 🏸
