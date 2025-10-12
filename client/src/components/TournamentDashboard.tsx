import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Paper,
  IconButton,
} from '@mui/material';
import { Sports, EmojiEvents, Score, Refresh, SwapHoriz } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Tournament, Player, Fixture } from '../types';
import { tournamentService, playerService } from '../services/api';

const TournamentDashboard: React.FC = () => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scoreDialog, setScoreDialog] = useState<{ open: boolean; fixture: Fixture | null }>({
    open: false,
    fixture: null,
  });
  const [scores, setScores] = useState({ team1: '', team2: '' });
  const [regenerateDialog, setRegenerateDialog] = useState(false);
  const [matchesPerPlayer, setMatchesPerPlayer] = useState(6);
  const [selectedPlayerForSwap, setSelectedPlayerForSwap] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      setLoading(true);
      const [tournamentData, playersData] = await Promise.all([
        tournamentService.getCurrentTournament(),
        playerService.getPlayers(),
      ]);
      
      setTournament(tournamentData);
      setPlayers(playersData);
      
      if (tournamentData) {
        setMatchesPerPlayer(tournamentData.matchesPerPlayer || 6);
      } else {
        navigate('/players');
      }
    } catch (err) {
      setError('Failed to load tournament data');
    } finally {
      setLoading(false);
    }
  };

  const getPlayerName = (playerId: string) => {
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

  const handleScoreClick = (fixture: Fixture) => {
    setScoreDialog({ open: true, fixture });
    setScores({ team1: '', team2: '' });
  };

  const handleScoreSubmit = async () => {
    if (!scoreDialog.fixture || !scores.team1 || !scores.team2) {
      setError('Please enter both scores');
      return;
    }

    const team1Score = parseInt(scores.team1);
    const team2Score = parseInt(scores.team2);

    if (isNaN(team1Score) || isNaN(team2Score)) {
      setError('Please enter valid numbers');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await tournamentService.submitScore(scoreDialog.fixture.id, team1Score, team2Score);
      setScoreDialog({ open: false, fixture: null });
      await loadData(); // Reload to get updated data
    } catch (err) {
      setError('Failed to submit score');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateTournament = async () => {
    try {
      setLoading(true);
      setError(null);
      const updatedTournament = await tournamentService.regenerateTournament(matchesPerPlayer);
      setTournament(updatedTournament);
      setRegenerateDialog(false);
    } catch (err) {
      setError('Failed to regenerate tournament');
    } finally {
      setLoading(false);
    }
  };

  const handleSwapPlayers = async (player1Id: string, player2Id: string) => {
    try {
      setLoading(true);
      setError(null);
      const updatedTournament = await tournamentService.swapPlayers(player1Id, player2Id);
      setTournament(updatedTournament);
      setSelectedPlayerForSwap(null);
    } catch (err) {
      setError('Failed to swap players');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerSwapClick = (playerId: string) => {
    if (!selectedPlayerForSwap) {
      setSelectedPlayerForSwap(playerId);
    } else if (selectedPlayerForSwap === playerId) {
      setSelectedPlayerForSwap(null);
    } else {
      // Direct swap without confirmation dialog
      handleSwapPlayers(selectedPlayerForSwap, playerId);
    }
  };

  const getPlayerParticipation = () => {
    if (!tournament) return new Map();
    
    const playerCounts = new Map();
    
    // Count matches for each player
    tournament.fixtures.forEach(fixture => {
      [...fixture.team1, ...fixture.team2].forEach(playerId => {
        playerCounts.set(playerId, (playerCounts.get(playerId) || 0) + 1);
      });
    });
    
    return playerCounts;
  };

  const getTeamStats = () => {
    if (!tournament) return { team1Wins: 0, team2Wins: 0 };
    
    const completedFixtures = tournament.fixtures.filter(f => f.status === 'completed');
    const team1Wins = completedFixtures.filter(f => f.winner === 'team1').length;
    const team2Wins = completedFixtures.filter(f => f.winner === 'team2').length;
    
    return { team1Wins, team2Wins };
  };

  const getActiveStep = () => {
    if (!tournament) return 0;
    
    const completedFixtures = tournament.fixtures.filter(f => f.status === 'completed').length;
    const totalFixtures = tournament.fixtures.length;
    
    if (completedFixtures === 0) return 0;
    if (completedFixtures === totalFixtures) return 2;
    return 1;
  };

  const steps = ['Teams Created', 'Matches in Progress', 'Tournament Complete'];

  if (!tournament) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          <Sports sx={{ mr: 1, verticalAlign: 'middle' }} />
          Tournament Dashboard
        </Typography>
        <Alert severity="info">
          No active tournament found. Please create a tournament first.
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

  const { team1Wins, team2Wins } = getTeamStats();
  const activeStep = getActiveStep();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        <Sports sx={{ mr: 1, verticalAlign: 'middle' }} />
        Tournament Dashboard
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Tournament Progress */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tournament Progress
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Matches per player: {tournament.matchesPerPlayer || 6} | Total matches: {tournament.fixtures.length}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Player participation: {Array.from(getPlayerParticipation().values()).join(', ')} matches
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Participation balance: Min {Math.min(...Array.from(getPlayerParticipation().values()))} - Max {Math.max(...Array.from(getPlayerParticipation().values()))} matches
          </Typography>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Paper sx={{ flex: 1, p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
              <Typography variant="h4">{team1Wins}</Typography>
              <Typography variant="body2">Team 1 Wins</Typography>
            </Paper>
            <Paper sx={{ flex: 1, p: 2, textAlign: 'center', bgcolor: 'secondary.light', color: 'white' }}>
              <Typography variant="h4">{team2Wins}</Typography>
              <Typography variant="body2">Team 2 Wins</Typography>
            </Paper>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Teams */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 300 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Team 1
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Players and their scheduled matches
                </Typography>
                <List>
                  {tournament.teams.team1.map((playerId, index) => {
                    const player = players.find(p => p.id === playerId);
                    return (
                      <React.Fragment key={playerId}>
                        <ListItem
                          sx={{
                            backgroundColor: selectedPlayerForSwap === playerId ? 'action.selected' : 'transparent',
                            borderRadius: 1,
                            mb: 1,
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            },
                          }}
                        >
                          <ListItemText
                            primary={player?.name || 'Unknown Player'}
                            secondary={
                              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                {player && (
                                  <Chip
                                    label={player.skillLevel}
                                    color={getSkillLevelColor(player.skillLevel) as any}
                                    size="small"
                                  />
                                )}
                                <Chip
                                  label={`${getPlayerParticipation().get(playerId) || 0} matches`}
                                  variant="outlined"
                                  size="small"
                                  color={
                                    (getPlayerParticipation().get(playerId) || 0) < (tournament.matchesPerPlayer || 6) - 1 
                                      ? "warning" 
                                      : (getPlayerParticipation().get(playerId) || 0) > (tournament.matchesPerPlayer || 6) + 1 
                                        ? "error" 
                                        : "success"
                                  }
                                />
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              onClick={() => handlePlayerSwapClick(playerId)}
                              color={selectedPlayerForSwap === playerId ? 'primary' : 'default'}
                              title={
                                selectedPlayerForSwap === playerId 
                                  ? "Selected for swap - click another player to swap" 
                                  : selectedPlayerForSwap 
                                    ? "Click to swap with selected player" 
                                    : "Click to select for swap"
                              }
                            >
                              <SwapHoriz />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < tournament.teams.team1.length - 1 && <Divider />}
                      </React.Fragment>
                    );
                  })}
                </List>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: 1, minWidth: 300 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Team 2
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Players and their scheduled matches
                </Typography>
                <List>
                  {tournament.teams.team2.map((playerId, index) => {
                    const player = players.find(p => p.id === playerId);
                    return (
                      <React.Fragment key={playerId}>
                        <ListItem
                          sx={{
                            backgroundColor: selectedPlayerForSwap === playerId ? 'action.selected' : 'transparent',
                            borderRadius: 1,
                            mb: 1,
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            },
                          }}
                        >
                          <ListItemText
                            primary={player?.name || 'Unknown Player'}
                            secondary={
                              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                {player && (
                                  <Chip
                                    label={player.skillLevel}
                                    color={getSkillLevelColor(player.skillLevel) as any}
                                    size="small"
                                  />
                                )}
                                <Chip
                                  label={`${getPlayerParticipation().get(playerId) || 0} matches`}
                                  variant="outlined"
                                  size="small"
                                  color={
                                    (getPlayerParticipation().get(playerId) || 0) < (tournament.matchesPerPlayer || 6) - 1 
                                      ? "warning" 
                                      : (getPlayerParticipation().get(playerId) || 0) > (tournament.matchesPerPlayer || 6) + 1 
                                        ? "error" 
                                        : "success"
                                  }
                                />
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              onClick={() => handlePlayerSwapClick(playerId)}
                              color={selectedPlayerForSwap === playerId ? 'primary' : 'default'}
                              title={
                                selectedPlayerForSwap === playerId 
                                  ? "Selected for swap - click another player to swap" 
                                  : selectedPlayerForSwap 
                                    ? "Click to swap with selected player" 
                                    : "Click to select for swap"
                              }
                            >
                              <SwapHoriz />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < tournament.teams.team2.length - 1 && <Divider />}
                      </React.Fragment>
                    );
                  })}
                </List>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Fixtures */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Matches ({tournament.fixtures.filter(f => f.status === 'completed').length}/{tournament.fixtures.length} completed)
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {tournament.fixtures.map((fixture) => (
                <Box key={fixture.id} sx={{ flex: '1 1 300px', minWidth: 300 }}>
                  <Card 
                    variant="outlined"
                    sx={{ 
                      p: 2,
                      cursor: fixture.status === 'pending' ? 'pointer' : 'default',
                      '&:hover': fixture.status === 'pending' ? { bgcolor: 'action.hover' } : {}
                    }}
                    onClick={() => fixture.status === 'pending' && handleScoreClick(fixture)}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      Match {tournament.fixtures.indexOf(fixture) + 1}
                    </Typography>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {getPlayerName(fixture.team1[0])} & {getPlayerName(fixture.team1[1])}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        vs
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getPlayerName(fixture.team2[0])} & {getPlayerName(fixture.team2[1])}
                      </Typography>
                    </Box>

                    {fixture.status === 'completed' ? (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">
                          {fixture.team1Score} - {fixture.team2Score}
                        </Typography>
                        <Chip
                          label={fixture.winner === 'team1' ? 'Team 1 Wins' : 'Team 2 Wins'}
                          color={fixture.winner === 'team1' ? 'primary' : 'secondary'}
                          size="small"
                        />
                      </Box>
                    ) : (
                      <Button
                        variant="outlined"
                        startIcon={<Score />}
                        fullWidth
                        size="small"
                      >
                        Enter Score
                      </Button>
                    )}
                  </Card>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Score Entry Dialog */}
      <Dialog open={scoreDialog.open} onClose={() => setScoreDialog({ open: false, fixture: null })}>
        <DialogTitle>Enter Match Score</DialogTitle>
        <DialogContent>
          {scoreDialog.fixture && (
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {getPlayerName(scoreDialog.fixture.team1[0])} & {getPlayerName(scoreDialog.fixture.team1[1])}
                <br />
                vs
                <br />
                {getPlayerName(scoreDialog.fixture.team2[0])} & {getPlayerName(scoreDialog.fixture.team2[1])}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  label="Team 1 Score"
                  type="number"
                  value={scores.team1}
                  onChange={(e) => setScores({ ...scores, team1: e.target.value })}
                  inputProps={{ min: 0 }}
                />
                <Typography variant="h6">-</Typography>
                <TextField
                  label="Team 2 Score"
                  type="number"
                  value={scores.team2}
                  onChange={(e) => setScores({ ...scores, team2: e.target.value })}
                  inputProps={{ min: 0 }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScoreDialog({ open: false, fixture: null })}>
            Cancel
          </Button>
          <Button onClick={handleScoreSubmit} variant="contained" disabled={loading}>
            Submit Score
          </Button>
        </DialogActions>
      </Dialog>

      {/* Regenerate Tournament Dialog */}
      <Dialog open={regenerateDialog} onClose={() => setRegenerateDialog(false)}>
        <DialogTitle>Regenerate Teams & Fixtures</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            This will create new balanced teams and generate fresh fixtures with the same players.
            All current match data will be lost.
          </Typography>
          <TextField
            label="Matches per Player"
            type="number"
            value={matchesPerPlayer}
            onChange={(e) => setMatchesPerPlayer(parseInt(e.target.value) || 6)}
            inputProps={{ min: 2, max: 12 }}
            fullWidth
            sx={{ mb: 2 }}
          />
          <Typography variant="body2" color="text.secondary">
            Each player will play approximately {matchesPerPlayer} matches in the new tournament.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegenerateDialog(false)}>Cancel</Button>
          <Button onClick={handleRegenerateTournament} variant="contained" disabled={loading}>
            Regenerate Tournament
          </Button>
        </DialogActions>
      </Dialog>

      {/* Navigation */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/players')}
        >
          Back to Players
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<Refresh />}
          onClick={() => setRegenerateDialog(true)}
          disabled={loading}
        >
          Regenerate Teams & Fixtures
        </Button>
        {selectedPlayerForSwap && (
          <Button
            variant="outlined"
            color="warning"
            onClick={() => setSelectedPlayerForSwap(null)}
            disabled={loading}
          >
            Clear Swap Selection
          </Button>
        )}
        <Button
          variant="contained"
          startIcon={<EmojiEvents />}
          onClick={() => navigate('/results')}
          disabled={activeStep < 2}
        >
          View Results
        </Button>
      </Box>
    </Box>
  );
};

export default TournamentDashboard;
