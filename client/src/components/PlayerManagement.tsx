import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemIcon,
  Divider,
  Checkbox,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { Add, Delete, Sports, Leaderboard, Refresh } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Player, LeaderboardEntry } from '../types';
import { playerService, tournamentService, leaderboardService } from '../services/api';

interface PlayerStats {
  id: string;
  name: string;
  skillLevel: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  winRate: number;
}

const PlayerManagement: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newPlayer, setNewPlayer] = useState({ name: '', skillLevel: 'beginner' });
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [matchesPerPlayer, setMatchesPerPlayer] = useState(5);
  const [createTournamentDialog, setCreateTournamentDialog] = useState(false);
  const [leaderboardTab, setLeaderboardTab] = useState(0);
  const [liveTournamentLeaderboard, setLiveTournamentLeaderboard] = useState<PlayerStats[]>([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [overallLeaderboard, setOverallLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [hasActiveTournament, setHasActiveTournament] = useState(false);
  const navigate = useNavigate();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const data = await playerService.getPlayers();
      setPlayers(data);
      setError(null); // Clear any previous errors
    } catch (err) {
      setError('Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const calculateLiveTournamentLeaderboard = useCallback((results: any, currentPlayers: Player[]) => {
    const { completedFixtures, players: tournamentPlayers } = results;
    if (!completedFixtures || completedFixtures.length === 0) {
      setLiveTournamentLeaderboard([]);
      return;
    }

    const stats = new Map<string, { wins: number; losses: number; played: number; name: string; skillLevel: string }>();

    completedFixtures.forEach((fixture: any) => {
      const winners = fixture.winner === 'team1' ? fixture.team1 : fixture.team2;
      const losers = fixture.winner === 'team1' ? fixture.team2 : fixture.team1;

      winners.forEach((playerId: string) => {
        if (!stats.has(playerId)) {
          const player = tournamentPlayers?.find((p: Player) => p.id === playerId) || 
                        currentPlayers.find(p => p.id === playerId);
          stats.set(playerId, {
            wins: 0,
            losses: 0,
            played: 0,
            name: player?.name || 'Unknown Player',
            skillLevel: player?.skillLevel || 'beginner'
          });
        }
        const stat = stats.get(playerId)!;
        stat.wins++;
        stat.played++;
      });

      losers.forEach((playerId: string) => {
        if (!stats.has(playerId)) {
          const player = tournamentPlayers?.find((p: Player) => p.id === playerId) || 
                        currentPlayers.find(p => p.id === playerId);
          stats.set(playerId, {
            wins: 0,
            losses: 0,
            played: 0,
            name: player?.name || 'Unknown Player',
            skillLevel: player?.skillLevel || 'beginner'
          });
        }
        const stat = stats.get(playerId)!;
        stat.losses++;
        stat.played++;
      });
    });

    const entries: PlayerStats[] = [];
    stats.forEach((stat, playerId) => {
      entries.push({
        id: playerId,
        name: stat.name,
        skillLevel: stat.skillLevel,
        matchesPlayed: stat.played,
        matchesWon: stat.wins,
        matchesLost: stat.losses,
        winRate: stat.played > 0 ? parseFloat(((stat.wins / stat.played) * 100).toFixed(2)) : 0
      });
    });

    entries.sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.matchesWon - a.matchesWon;
    });

    setLiveTournamentLeaderboard(entries);
  }, []);

  const loadLeaderboards = useCallback(async (currentPlayers: Player[]) => {
    try {
      // Load live tournament leaderboard
      try {
        const tournamentResults = await tournamentService.getTournamentResults();
        if (tournamentResults && tournamentResults.completedFixtures.length > 0) {
          setHasActiveTournament(true);
          calculateLiveTournamentLeaderboard(tournamentResults, currentPlayers);
        } else {
          setHasActiveTournament(false);
          setLiveTournamentLeaderboard([]);
        }
      } catch (err) {
        setHasActiveTournament(false);
        setLiveTournamentLeaderboard([]);
      }

      // Load historical leaderboards from database
      const now = new Date();
      const [overall, monthly, weekly] = await Promise.all([
        leaderboardService.getOverallLeaderboard(),
        leaderboardService.getMonthlyLeaderboard(
          now.getFullYear(),
          now.getMonth() + 1
        ),
        leaderboardService.getWeeklyLeaderboard(
          now.getFullYear(),
          getWeekNumber(now)
        )
      ]);

      setOverallLeaderboard(overall);
      setMonthlyLeaderboard(monthly);
      setWeeklyLeaderboard(weekly);
    } catch (err) {
      console.error('Error loading leaderboards:', err);
    }
  }, [calculateLiveTournamentLeaderboard]);

  // Initial load
  useEffect(() => {
    const initialize = async () => {
      await loadPlayers();
    };
    initialize();
  }, []);

  // Load leaderboards after players are loaded and set up interval
  useEffect(() => {
    if (players.length > 0) {
      loadLeaderboards(players);
      
      // Set up auto-refresh every 30 seconds
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(() => {
        loadLeaderboards(players);
      }, 30000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players.length]); // Only re-run if number of players changes to prevent flickering

  const handleAddPlayer = async () => {
    if (!newPlayer.name.trim()) {
      setError('Player name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const player = await playerService.addPlayer(newPlayer.name, newPlayer.skillLevel);
      setPlayers([...players, player]);
      setSelectedPlayers([...selectedPlayers, player.id]); // Auto-select new player
      setNewPlayer({ name: '', skillLevel: 'beginner' });
      setSuccess('Player added successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to add player');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlayer = async (id: string) => {
    try {
      setLoading(true);
      await playerService.deletePlayer(id);
      setPlayers(players.filter(p => p.id !== id));
      setSelectedPlayers(selectedPlayers.filter(playerId => playerId !== id));
      setSuccess('Player deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete player');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerSelection = (playerId: string) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleCreateTournament = () => {
    if (selectedPlayers.length < 4) {
      setError('At least 4 players are required for a tournament');
      return;
    }
    setCreateTournamentDialog(true);
  };

  const confirmCreateTournament = async () => {
    try {
      setLoading(true);
      setError(null);
      await tournamentService.createTournament(selectedPlayers, matchesPerPlayer);
      setCreateTournamentDialog(false);
      navigate('/tournament');
    } catch (err) {
      setError('Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return 'default';
    }
  };

  const renderLeaderboardTable = (data: PlayerStats[] | LeaderboardEntry[], title: string) => {
    if (data.length === 0) {
      return <Alert severity="info">No data available for {title}.</Alert>;
    }

    return (
      <TableContainer component={Paper} elevation={0}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Rank</strong></TableCell>
              <TableCell><strong>Player</strong></TableCell>
              <TableCell align="center"><strong>Skill</strong></TableCell>
              <TableCell align="center"><strong>Matches</strong></TableCell>
              <TableCell align="center"><strong>Wins</strong></TableCell>
              <TableCell align="center"><strong>Losses</strong></TableCell>
              <TableCell align="center"><strong>Win Rate</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((entry, index) => (
              <TableRow 
                key={entry.id}
                sx={{ 
                  bgcolor: index === 0 ? 'rgba(255, 215, 0, 0.2)' : 
                          index === 1 ? 'rgba(192, 192, 192, 0.2)' : 
                          index === 2 ? 'rgba(205, 127, 50, 0.2)' : 'inherit',
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
                  <Typography variant="body2" fontWeight={index < 3 ? 'bold' : 'normal'}>
                    {entry.name}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={entry.skillLevel}
                    color={getSkillLevelColor(entry.skillLevel) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">{entry.matchesPlayed}</TableCell>
                <TableCell align="center">
                  <Typography color="success.main" fontWeight="medium">
                    {entry.matchesWon}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography color="error.main">
                    {entry.matchesLost}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={`${entry.winRate}%`}
                    color={entry.winRate >= 70 ? 'success' : entry.winRate >= 50 ? 'warning' : 'error'}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        <Sports sx={{ mr: 1, verticalAlign: 'middle' }} />
        Player Management
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Top Row - Forms */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {/* Add Player Form */}
          <Box sx={{ flex: 1, minWidth: 300 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Add New Player
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    label="Player Name"
                    value={newPlayer.name}
                    onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                    fullWidth
                  />
                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Skill Level</InputLabel>
                    <Select
                      value={newPlayer.skillLevel}
                      onChange={(e) => setNewPlayer({ ...newPlayer, skillLevel: e.target.value })}
                      label="Skill Level"
                    >
                      <MenuItem value="beginner">Beginner</MenuItem>
                      <MenuItem value="intermediate">Intermediate</MenuItem>
                      <MenuItem value="advanced">Advanced</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleAddPlayer}
                  disabled={loading || !newPlayer.name.trim()}
                  fullWidth
                >
                  Add Player
                </Button>
              </CardContent>
            </Card>
          </Box>

          {/* Tournament Creation */}
          <Box sx={{ flex: 1, minWidth: 300 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Create Tournament
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Select players for the next tournament (minimum 4 players required)
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    label="Matches per Player"
                    type="number"
                    value={matchesPerPlayer}
                    onChange={(e) => setMatchesPerPlayer(parseInt(e.target.value) || 5)}
                    inputProps={{ min: 2, max: 12 }}
                    sx={{ width: 150 }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                    Each player will play approximately {matchesPerPlayer} matches
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleCreateTournament}
                  disabled={selectedPlayers.length < 4 || loading}
                  fullWidth
                >
                  Create Tournament ({selectedPlayers.length} players selected)
                </Button>
                {selectedPlayers.length < 4 && selectedPlayers.length > 0 && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    Need at least 4 players for a tournament
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Players List */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Players ({players.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setSelectedPlayers(players.map(p => p.id))}
                disabled={selectedPlayers.length === players.length}
              >
                Select All
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setSelectedPlayers([])}
                disabled={selectedPlayers.length === 0}
              >
                Deselect All
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                {selectedPlayers.length} selected for tournament
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {players.length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                No players added yet. Add some players to get started!
              </Typography>
            ) : (
              <List>
                {players.map((player, index) => (
                  <React.Fragment key={player.id}>
                    <ListItem
                      onClick={() => handlePlayerSelection(player.id)}
                      sx={{
                        backgroundColor: selectedPlayers.includes(player.id) ? 'action.selected' : 'transparent',
                        borderRadius: 1,
                        mb: 1,
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemIcon>
                        <Checkbox
                          checked={selectedPlayers.includes(player.id)}
                          onChange={() => handlePlayerSelection(player.id)}
                          onClick={(e) => e.stopPropagation()}
                          color="primary"
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={player.name}
                        secondary={
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Chip
                              label={player.skillLevel}
                              color={getSkillLevelColor(player.skillLevel) as any}
                              size="small"
                            />
                            <Chip
                              label={`${player.matchesWon}/${player.matchesPlayed} wins`}
                              variant="outlined"
                              size="small"
                            />
                            {selectedPlayers.includes(player.id) && (
                              <Chip
                                label="Playing Tournament"
                                color="primary"
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePlayer(player.id);
                          }}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < players.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        {/* Leaderboards Section */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                <Leaderboard sx={{ mr: 1, verticalAlign: 'middle' }} />
                Player Leaderboards
              </Typography>
              <IconButton onClick={() => loadLeaderboards(players)} size="small" title="Refresh leaderboards">
                <Refresh />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <Tabs 
              value={leaderboardTab} 
              onChange={(e, newValue) => setLeaderboardTab(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
            >
              <Tab label="Live Tournament" disabled={!hasActiveTournament} />
              <Tab label="This Week" />
              <Tab label="This Month" />
              <Tab label="All-Time" />
            </Tabs>

            {leaderboardTab === 0 && (
              hasActiveTournament ? (
                <>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Live tournament statistics - updates automatically every 30 seconds
                  </Alert>
                  {renderLeaderboardTable(liveTournamentLeaderboard, 'Live Tournament')}
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/tournament')}
                    >
                      Go to Tournament Dashboard
                    </Button>
                  </Box>
                </>
              ) : (
                <Alert severity="info">
                  No active tournament. Create a tournament to see live statistics!
                </Alert>
              )
            )}

            {leaderboardTab === 1 && renderLeaderboardTable(weeklyLeaderboard, 'This Week')}
            {leaderboardTab === 2 && renderLeaderboardTable(monthlyLeaderboard, 'This Month')}
            {leaderboardTab === 3 && renderLeaderboardTable(overallLeaderboard, 'All-Time')}
          </CardContent>
        </Card>
      </Box>

      {/* Create Tournament Confirmation Dialog */}
      <Dialog open={createTournamentDialog} onClose={() => setCreateTournamentDialog(false)}>
        <DialogTitle>Create Tournament</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to create a tournament with {selectedPlayers.length} players?
            Each player will play approximately {matchesPerPlayer} matches.
            The AI will automatically create balanced teams and generate fixtures.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateTournamentDialog(false)}>Cancel</Button>
          <Button onClick={confirmCreateTournament} variant="contained" disabled={loading}>
            Create Tournament
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlayerManagement;
