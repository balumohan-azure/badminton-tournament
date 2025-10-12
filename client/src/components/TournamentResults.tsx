import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar,
} from '@mui/material';
import { EmojiEvents, Sports, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { TournamentResults as TournamentResultsType, Player } from '../types';
import { tournamentService } from '../services/api';

const TournamentResults: React.FC = () => {
  const [results, setResults] = useState<TournamentResultsType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);
      const data = await tournamentService.getTournamentResults();
      setResults(data);
    } catch (err) {
      setError('Failed to load tournament results');
    } finally {
      setLoading(false);
    }
  };

  const getPlayerName = (playerId: string, players: Player[]) => {
    return players.find(p => p.id === playerId)?.name || 'Unknown Player';
  };

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          <EmojiEvents sx={{ mr: 1, verticalAlign: 'middle' }} />
          Tournament Results
        </Typography>
        <Alert severity="info">Loading tournament results...</Alert>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          <EmojiEvents sx={{ mr: 1, verticalAlign: 'middle' }} />
          Tournament Results
        </Typography>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/tournament')}
          sx={{ mt: 2 }}
        >
          Back to Tournament
        </Button>
      </Box>
    );
  }

  if (!results) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          <EmojiEvents sx={{ mr: 1, verticalAlign: 'middle' }} />
          Tournament Results
        </Typography>
        <Alert severity="info">
          No tournament results available. Complete a tournament first.
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/players')}
          sx={{ mt: 2 }}
        >
          Go to Player Management
        </Button>
      </Box>
    );
  }

  const { tournament, teamStats, champion, completedFixtures } = results;
  const winningTeam = teamStats.team1.wins > teamStats.team2.wins ? 'Team 1' : 'Team 2';
  const isDraw = teamStats.team1.wins === teamStats.team2.wins;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        <EmojiEvents sx={{ mr: 1, verticalAlign: 'middle' }} />
        Tournament Results
      </Typography>

      {/* Champion Announcement */}
      {champion && (
        <Card sx={{ mb: 3, bgcolor: 'gold', color: 'black' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'black' }}>
              <EmojiEvents sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h3" gutterBottom>
              🏆 CHAMPION OF THE WEEK 🏆
            </Typography>
            <Typography variant="h4" gutterBottom>
              {champion.name}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Chip
                label={champion.skillLevel}
                color={getSkillLevelColor(champion.skillLevel) as any}
                size="medium"
                sx={{ fontSize: '1rem', height: '32px' }}
              />
              <Chip
                label={`${champion.matchesWon}/${champion.matchesPlayed} wins`}
                variant="outlined"
                size="medium"
                sx={{ fontSize: '1rem', height: '32px' }}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Team Results */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: 300 }}>
          <Card sx={{ 
            bgcolor: teamStats.team1.wins > teamStats.team2.wins ? 'success.light' : 'grey.100',
            color: teamStats.team1.wins > teamStats.team2.wins ? 'white' : 'text.primary'
          }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Team 1
              </Typography>
              <Typography variant="h2" gutterBottom>
                {teamStats.team1.wins}
              </Typography>
              <Typography variant="h6" gutterBottom>
                {teamStats.team1.wins > teamStats.team2.wins ? '🏆 WINNERS' : 
                 teamStats.team1.wins === teamStats.team2.wins ? '🤝 DRAW' : 'Runner Up'}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1, minWidth: 300 }}>
          <Card sx={{ 
            bgcolor: teamStats.team2.wins > teamStats.team1.wins ? 'success.light' : 'grey.100',
            color: teamStats.team2.wins > teamStats.team1.wins ? 'white' : 'text.primary'
          }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Team 2
              </Typography>
              <Typography variant="h2" gutterBottom>
                {teamStats.team2.wins}
              </Typography>
              <Typography variant="h6" gutterBottom>
                {teamStats.team2.wins > teamStats.team1.wins ? '🏆 WINNERS' : 
                 teamStats.team2.wins === teamStats.team1.wins ? '🤝 DRAW' : 'Runner Up'}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Match Results */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Match Results ({completedFixtures.length} matches completed)
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {completedFixtures.map((fixture, index) => (
              <Box key={fixture.id} sx={{ flex: '1 1 300px', minWidth: 300 }}>
                <Paper sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Match {index + 1}
                  </Typography>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {getPlayerName(fixture.team1[0], [])} & {getPlayerName(fixture.team1[1], [])}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center">
                      vs
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {getPlayerName(fixture.team2[0], [])} & {getPlayerName(fixture.team2[1], [])}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">
                      {fixture.team1Score} - {fixture.team2Score}
                    </Typography>
                    <Chip
                      label={fixture.winner === 'team1' ? 'Team 1' : 'Team 2'}
                      color={fixture.winner === 'team1' ? 'primary' : 'secondary'}
                      size="small"
                    />
                  </Box>
                </Paper>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Tournament Summary */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tournament Summary
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Tournament Date"
                secondary={new Date(tournament.createdAt).toLocaleDateString()}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Total Matches"
                secondary={tournament.fixtures.length}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Completed Matches"
                secondary={completedFixtures.length}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Tournament Status"
                secondary={tournament.status === 'completed' ? 'Completed' : 'In Progress'}
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Navigation */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/tournament')}
        >
          Back to Tournament
        </Button>
        <Button
          variant="contained"
          startIcon={<Sports />}
          onClick={() => navigate('/players')}
        >
          Start New Tournament
        </Button>
      </Box>
    </Box>
  );
};

export default TournamentResults;
