# 🏸 Badminton Tournament Manager

A modern, AI-powered web application for managing doubles badminton tournaments with intelligent team creation and fixture management.

## ✨ Features

- **Player Management**: Add/remove players with skill levels (Beginner, Intermediate, Advanced)
- **AI-Powered Team Creation**: Uses Google Gemini AI to create balanced teams based on skill levels
- **Smart Fixture Generation**: Automatically creates matches ensuring no repeated pairings
- **Real-time Scoring**: Enter match scores and track tournament progress
- **Champion Tracking**: Automatically determines the champion based on match wins
- **Modern UI**: Built with Material-UI for a beautiful, responsive interface
- **Tournament Analytics**: View detailed results and statistics

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Gemini API key

### Installation

1. **Clone and setup the project:**
   ```bash
   cd badminton_tournament
   npm run install-all
   ```

2. **Configure Gemini AI API:**
   ```bash
   cd server
   cp env.example .env
   ```
   
   Edit `.env` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

3. **Get your Gemini API key:**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy it to your `.env` file

### Running the Application

1. **Start both frontend and backend:**
   ```bash
   npm run dev
   ```

2. **Or start them separately:**
   ```bash
   # Terminal 1 - Backend
   npm run server
   
   # Terminal 2 - Frontend  
   npm run client
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

## 🎮 How to Use

### 1. Add Players
- Navigate to the Player Management page
- Add players with their names and skill levels
- Select players for the next tournament (minimum 4 required)

### 2. Create Tournament
- Click "Create Tournament" with selected players
- AI will automatically create balanced teams
- Fixtures will be generated ensuring no repeated matchups

### 3. Manage Matches
- View the tournament dashboard
- Click "Enter Score" for pending matches
- Enter scores for both teams
- Track tournament progress in real-time

### 4. View Results
- Once all matches are completed, view the results page
- See team standings and individual champion
- Review all match results and statistics

## 🏗️ Project Structure

```
badminton_tournament/
├── client/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/      # API service layer
│   │   ├── types/         # TypeScript type definitions
│   │   └── App.tsx        # Main app component
│   └── package.json
├── server/                # Node.js Express backend
│   ├── index.js          # Main server file
│   ├── package.json
│   └── env.example       # Environment variables template
└── package.json          # Root package.json for scripts
```

## 🔧 Technical Details

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI)
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **State Management**: React hooks (useState, useEffect)

### Backend (Node.js + Express)
- **Runtime**: Node.js with Express.js
- **AI Integration**: Google Gemini AI API
- **CORS**: Enabled for cross-origin requests
- **Data Storage**: In-memory (can be easily extended to use a database)

### AI Features
- **Team Balancing**: AI analyzes player skill levels to create balanced teams
- **Smart Pairing**: Ensures optimal team composition
- **Fallback Logic**: Falls back to random assignment if AI fails

## 🎯 Key Features Explained

### Intelligent Team Creation
The AI analyzes all selected players and their skill levels to create two balanced teams. It considers:
- Skill level distribution
- Overall team strength balance
- Optimal pairing possibilities

### Fixture Generation
- Creates all possible match combinations between teams
- Ensures no repeated matchups
- Minimizes repeated player pairings within teams

### Champion Determination
- Tracks individual match wins for each player
- Declares the player with the most wins as "Champion of the Week"
- Updates player statistics automatically

## 🚀 Deployment

### Local Development
The app is ready to run locally with the commands above.

### Production Deployment
For production deployment:

1. **Build the frontend:**
   ```bash
   npm run build
   ```

2. **Deploy backend:**
   - Set up a Node.js server
   - Install dependencies: `cd server && npm install --production`
   - Set environment variables
   - Start with: `npm start`

3. **Deploy frontend:**
   - Serve the `client/build` folder with any static file server
   - Update API URLs in production

## 🔒 Environment Variables

Create a `.env` file in the `server` directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
NODE_ENV=production
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **"Failed to create tournament"**
   - Check if Gemini API key is correctly set
   - Ensure you have at least 4 players selected

2. **CORS errors**
   - Make sure backend is running on port 5000
   - Check if CORS is properly configured

3. **Players not loading**
   - Verify backend server is running
   - Check browser console for API errors

### Getting Help

If you encounter issues:
1. Check the browser console for errors
2. Verify all dependencies are installed
3. Ensure environment variables are set correctly
4. Check that both frontend and backend are running

## 🎉 Enjoy Your Tournament!

This application makes organizing badminton tournaments fun and efficient. The AI ensures fair team creation while the modern interface makes managing everything a breeze.

Happy playing! 🏸

