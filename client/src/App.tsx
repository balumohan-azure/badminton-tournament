import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container, AppBar, Toolbar, Typography, Box } from '@mui/material';
import PlayerManagement from './components/PlayerManagement';
import TournamentDashboard from './components/TournamentDashboard';
import TournamentResults from './components/TournamentResults';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router basename={process.env.PUBLIC_URL}>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                🏸 Badminton Tournament Manager
              </Typography>
            </Toolbar>
          </AppBar>
          
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Routes>
              <Route path="/" element={<Navigate to="/players" replace />} />
              <Route path="/players" element={<PlayerManagement />} />
              <Route path="/tournament" element={<TournamentDashboard />} />
              <Route path="/results" element={<TournamentResults />} />
            </Routes>
          </Container>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
