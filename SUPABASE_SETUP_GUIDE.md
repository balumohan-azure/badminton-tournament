# Supabase Database Setup Guide

## Overview
This guide will help you set up Supabase for your badminton tournament application. Supabase provides a free PostgreSQL database with powerful features for tracking player statistics and leaderboards.

## Step 1: Create Supabase Project (5 minutes)

1. **Sign up for Supabase**
   - Go to https://supabase.com
   - Click "Start your project"
   - Sign up with GitHub, Google, or email

2. **Create New Project**
   - Click "New Project"
   - **Organization**: Select or create one
   - **Project Name**: `badminton-tournament` (or any name you prefer)
   - **Database Password**: Create a strong password and **SAVE IT SECURELY**
   - **Region**: Choose the closest to your location for best performance
   - **Pricing Plan**: Free tier is perfect for this app
   - Click "Create new project"
   - Wait ~2 minutes for project creation

3. **Get API Credentials**
   - Once project is ready, go to **Project Settings** (gear icon in sidebar)
   - Click **API** in the left menu
   - Copy these two values:
     - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
     - **anon public key**: Long string starting with `eyJ...`

## Step 2: Run Database Schema (2 minutes)

1. **Open SQL Editor**
   - In your Supabase project dashboard
   - Click **SQL Editor** in the left sidebar
   - Click **+ New query**

2. **Run Schema Script**
   - Open the file `server/supabase-schema.sql` from your project
   - Copy ALL the contents
   - Paste into the SQL Editor
   - Click **Run** (or press Ctrl/Cmd + Enter)
   - You should see "Success. No rows returned"

3. **Verify Tables Created**
   - Click **Table Editor** in the left sidebar
   - You should see 3 tables:
     - `players`
     - `tournaments`
     - `matches`

## Step 3: Configure Environment Variables

### For Local Development:

1. **Update Server Environment**
   ```bash
   cd server
   ```

2. **Create/Update `.env` file**
   ```env
   GEMINI_API_KEY=your_existing_gemini_key
   
   SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   
   PORT=5000
   NODE_ENV=development
   ```

3. **Replace with your actual values**:
   - Copy `SUPABASE_URL` from Step 1
   - Copy `SUPABASE_ANON_KEY` from Step 1

### For Render.com Deployment:

1. **Go to Render.com Dashboard**
   - Open your deployed backend service

2. **Add Environment Variables**
   - Go to **Environment** tab
   - Click **Add Environment Variable**
   - Add these two variables:
     ```
     Key: SUPABASE_URL
     Value: https://xxxxxxxxxxxxx.supabase.co
     
     Key: SUPABASE_ANON_KEY
     Value: eyJxxxxxxxxxxxxxxxxxxxxxxxxxxxx
     ```
   - Click **Save Changes**
   - Render will automatically redeploy your service

## Step 4: Test the Integration

1. **Start Your Local Server**
   ```bash
   cd server
   npm start
   ```

2. **Test Player Creation**
   - Open your frontend (http://localhost:3000 or your GitHub Pages URL)
   - Try adding a new player
   - The player should be saved to Supabase

3. **Verify in Supabase**
   - Go to Supabase **Table Editor**
   - Click on `players` table
   - You should see your new player!

4. **Test Tournament Creation**
   - Create a tournament with your players
   - Check the `tournaments` and `matches` tables in Supabase
   - Complete a match and verify it's updated

5. **Test Leaderboard**
   - Open browser console and test:
   ```javascript
   fetch('http://localhost:5000/api/leaderboard/overall')
     .then(r => r.json())
     .then(data => console.log(data))
   ```

## What's Been Implemented

### ✅ Database Schema
- **players** table: Stores player information
- **tournaments** table: Stores tournament metadata
- **matches** table: Stores all match details with results
- **player_statistics** view: Auto-calculated stats for leaderboards
- SQL functions for weekly/monthly leaderboards

### ✅ Backend API Endpoints
- `GET /api/players` - Fetch all players from database
- `POST /api/players` - Create new player in database
- `DELETE /api/players/:id` - Delete player
- `POST /api/tournament/create` - Create tournament and store matches
- `POST /api/tournament/score` - Update match results
- `GET /api/leaderboard/overall` - Get all-time leaderboard
- `GET /api/leaderboard/monthly?year=2024&month=11` - Get monthly leaderboard
- `GET /api/leaderboard/weekly?year=2024&week=46` - Get weekly leaderboard

### ✅ Frontend Integration
- Updated TypeScript types to include `LeaderboardEntry`
- Added `leaderboardService` with all three leaderboard methods
- Ready to build leaderboard UI components

## Next Steps (Optional)

### Build Leaderboard UI Component

You can create a new component to display leaderboards:

```typescript
// client/src/components/Leaderboard.tsx
import React, { useEffect, useState } from 'react';
import { leaderboardService } from '../services/api';
import { LeaderboardEntry } from '../types';

export const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState<'overall' | 'monthly' | 'weekly'>('overall');

  useEffect(() => {
    loadLeaderboard();
  }, [period]);

  const loadLeaderboard = async () => {
    try {
      let data;
      if (period === 'overall') {
        data = await leaderboardService.getOverallLeaderboard();
      } else if (period === 'monthly') {
        const now = new Date();
        data = await leaderboardService.getMonthlyLeaderboard(
          now.getFullYear(),
          now.getMonth() + 1
        );
      } else {
        // Calculate current week
        data = await leaderboardService.getWeeklyLeaderboard(2024, 46);
      }
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  return (
    <div className="leaderboard">
      <h2>Leaderboard</h2>
      <div className="period-selector">
        <button onClick={() => setPeriod('overall')}>Overall</button>
        <button onClick={() => setPeriod('monthly')}>This Month</button>
        <button onClick={() => setPeriod('weekly')}>This Week</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Matches</th>
            <th>Won</th>
            <th>Lost</th>
            <th>Win Rate</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((player, index) => (
            <tr key={player.id}>
              <td>{index + 1}</td>
              <td>{player.name}</td>
              <td>{player.matchesPlayed}</td>
              <td>{player.matchesWon}</td>
              <td>{player.matchesLost}</td>
              <td>{player.winRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

## Troubleshooting

### Issue: "Failed to fetch players"
- Check if `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set correctly
- Verify server is restarted after adding environment variables
- Check Supabase project is not paused (free tier pauses after 1 week of inactivity)

### Issue: "Permission denied" errors
- Verify Row Level Security policies are created (they're in the schema)
- Check Supabase project settings for any access restrictions

### Issue: Leaderboard returns empty array
- This is normal if no matches have been completed yet
- Complete some tournament matches first
- Statistics only show for players who have played at least one match

### Issue: Tables not found
- Re-run the entire `supabase-schema.sql` script
- Check for any SQL errors in the Supabase SQL Editor

## Support

If you encounter any issues:
1. Check Supabase logs: Project → Logs
2. Check server console for error messages
3. Verify environment variables are loaded: Add `console.log(process.env.SUPABASE_URL)` in server code

## Free Tier Limits

Supabase free tier includes:
- 500 MB database storage
- 2 GB bandwidth per month
- 50,000 monthly active users
- Unlimited API requests

This is more than enough for a badminton tournament app!

## Success Checklist

- [ ] Supabase project created
- [ ] Database schema executed successfully
- [ ] Environment variables configured (local)
- [ ] Environment variables configured (Render.com)
- [ ] Player creation works
- [ ] Tournament creation works
- [ ] Match scoring works
- [ ] Leaderboard API responds
- [ ] All todos completed ✅

---

**Congratulations!** Your badminton tournament app now has a powerful database backend with full statistics tracking and leaderboard support! 🏸

