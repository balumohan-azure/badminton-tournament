import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { Add, Delete, Sports } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Player } from '../types';
import { playerService, tournamentService } from '../services/api';

const PlayerManagement: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newPlayer, setNewPlayer] = useState({ name: '', skillLevel: 'beginner' });
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [matchesPerPlayer, setMatchesPerPlayer] = useState(5);
  const [createTournamentDialog, setCreateTournamentDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const data = await playerService.getPlayers();
      setPlayers(data);
    } catch (err) {
      setError('Failed to load players');
    } finally {
      setLoading(false);
    }
  };

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
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setMatchesPerPlayer(5);
                      } else {
                        const num = parseInt(val);
                        if (!isNaN(num) && num >= 2 && num <= 12) {
                          setMatchesPerPlayer(num);
                        }
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                    inputProps={{ 
                      min: 2, 
                      max: 12,
                      inputMode: 'numeric',
                      pattern: '[0-9]*'
                    }}
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
