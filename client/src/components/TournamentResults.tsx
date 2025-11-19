import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { EmojiEvents, Sports, ArrowBack, Leaderboard } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { TournamentResults as TournamentResultsType, Player } from '../types';
import { tournamentService } from '../services/api';

interface PlayerStats {
  id: string;
  name: string;
  skillLevel: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  winRate: number;
}

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

  const calculateTournamentLeaderboard = (): PlayerStats[] => {
    if (!results) return [];

    const { completedFixtures, players } = results;
    if (completedFixtures.length === 0) return [];

    const stats = new Map<string, { wins: number; losses: number; played: number }>();

    // Initialize stats for all players
    players.forEach((player: Player) => {
      stats.set(player.id, { wins: 0, losses: 0, played: 0 });
    });

    // Calculate stats from completed fixtures
    completedFixtures.forEach(fixture => {
      const winners = fixture.winner === 'team1' ? fixture.team1 : fixture.team2;
      const losers = fixture.winner === 'team1' ? fixture.team2 : fixture.team1;

      winners.forEach((playerId: string) => {
        const stat = stats.get(playerId);
        if (stat) {
          stat.wins++;
          stat.played++;
        }
      });

      losers.forEach((playerId: string) => {
        const stat = stats.get(playerId);
        if (stat) {
          stat.losses++;
          stat.played++;
        }
      });
    });

    // Convert to leaderboard entries
    const entries: PlayerStats[] = [];
    players.forEach((player: Player) => {
      const stat = stats.get(player.id);
      if (stat && stat.played > 0) {
        entries.push({
          id: player.id,
          name: player.name,
          skillLevel: player.skillLevel,
          matchesPlayed: stat.played,
          matchesWon: stat.wins,
          matchesLost: stat.losses,
          winRate: stat.played > 0 ? parseFloat(((stat.wins / stat.played) * 100).toFixed(2)) : 0
        });
      }
    });

    // Sort by win rate, then by wins
    entries.sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.matchesWon - a.matchesWon;
    });

    return entries;
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

  const { tournament, teamStats, champion, completedFixtures, players } = results;

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
                      {getPlayerName(fixture.team1[0], players)} & {getPlayerName(fixture.team1[1], players)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center">
                      vs
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {getPlayerName(fixture.team2[0], players)} & {getPlayerName(fixture.team2[1], players)}
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

      {/* Player Leaderboard */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <Leaderboard sx={{ mr: 1, verticalAlign: 'middle' }} />
            Player Leaderboard (Tournament Stats)
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {calculateTournamentLeaderboard().length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Rank</strong></TableCell>
                    <TableCell><strong>Player</strong></TableCell>
                    <TableCell align="center"><strong>Skill Level</strong></TableCell>
                    <TableCell align="center"><strong>Matches</strong></TableCell>
                    <TableCell align="center"><strong>Wins</strong></TableCell>
                    <TableCell align="center"><strong>Losses</strong></TableCell>
                    <TableCell align="center"><strong>Win Rate</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {calculateTournamentLeaderboard().map((player, index) => (
                    <TableRow 
                      key={player.id}
                      sx={{ 
                        bgcolor: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? '#cd7f32' : 'inherit',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <TableCell>
                        {index === 0 && <span>🥇</span>}
                        {index === 1 && <span>🥈</span>}
                        {index === 2 && <span>🥉</span>}
                        {index > 2 && <span>{index + 1}</span>}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight={index < 3 ? 'bold' : 'normal'}>
                          {player.name}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={player.skillLevel}
                          color={getSkillLevelColor(player.skillLevel) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">{player.matchesPlayed}</TableCell>
                      <TableCell align="center">
                        <Typography color="success.main" fontWeight="medium">
                          {player.matchesWon}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography color="error.main">
                          {player.matchesLost}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${player.winRate}%`}
                          color={player.winRate >= 70 ? 'success' : player.winRate >= 50 ? 'warning' : 'error'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">No matches completed in this tournament yet.</Alert>
          )}
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
