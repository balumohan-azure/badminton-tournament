const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

// In-memory cache for active tournament (will be replaced with DB queries)
let currentTournament = null;

// Player Management Routes
app.get('/api/players', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Transform to match frontend expectations
    const players = data.map(p => ({
      id: p.id,
      name: p.name,
      skillLevel: p.skill_level,
      matchesPlayed: 0, // Will be calculated from player_statistics view
      matchesWon: 0 // Will be calculated from player_statistics view
    }));
    
  res.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

app.post('/api/players', async (req, res) => {
  try {
  const { name, skillLevel } = req.body;
  
  if (!name || !skillLevel) {
    return res.status(400).json({ error: 'Name and skill level are required' });
  }

  const validSkillLevels = ['beginner', 'intermediate', 'advanced'];
  if (!validSkillLevels.includes(skillLevel.toLowerCase())) {
    return res.status(400).json({ error: 'Invalid skill level. Must be beginner, intermediate, or advanced' });
  }

    const { data, error } = await supabase
      .from('players')
      .insert([
        {
    name,
          skill_level: skillLevel.toLowerCase()
        }
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({ error: 'Player name already exists' });
      }
      throw error;
    }

    // Transform to match frontend expectations
  const player = {
      id: data.id,
      name: data.name,
      skillLevel: data.skill_level,
    matchesPlayed: 0,
    matchesWon: 0
  };

  res.status(201).json(player);
  } catch (error) {
    console.error('Error creating player:', error);
    res.status(500).json({ error: 'Failed to create player' });
  }
});

app.delete('/api/players/:id', async (req, res) => {
  try {
  const playerId = req.params.id;
    
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', playerId);
    
    if (error) throw error;
    
  res.json({ message: 'Player deleted successfully' });
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ error: 'Failed to delete player' });
  }
});

// Tournament Management Routes
app.get('/api/tournament/current', async (req, res) => {
  try {
    // If we have in-memory cache, return it
    if (currentTournament) {
      return res.json(currentTournament);
    }

    // Otherwise, try to load active tournament from database
    const { data: tournaments, error: tournamentsError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (tournamentsError) throw tournamentsError;

    if (!tournaments || tournaments.length === 0) {
      return res.json(null);
    }

    const tournament = tournaments[0];

    // Load matches for this tournament
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', tournament.id)
      .order('created_at', { ascending: true });

    if (matchesError) throw matchesError;

    if (!matches || matches.length === 0) {
      return res.json(null);
    }

    // Extract unique player IDs and reconstruct teams
    const team1Players = new Set();
    const team2Players = new Set();
    
    matches.forEach(match => {
      // Determine team assignment based on majority
      // This is a simplified approach - assumes consistent team assignment
      team1Players.add(match.team1_player1_id);
      team1Players.add(match.team1_player2_id);
      team2Players.add(match.team2_player1_id);
      team2Players.add(match.team2_player2_id);
    });

    // Convert matches to fixtures format
    const fixtures = matches.map(m => ({
      id: m.id,
      team1: [m.team1_player1_id, m.team1_player2_id],
      team2: [m.team2_player1_id, m.team2_player2_id],
      status: m.status,
      team1Score: m.team1_score,
      team2Score: m.team2_score,
      winner: m.winner_team === 1 ? 'team1' : m.winner_team === 2 ? 'team2' : undefined,
      completedAt: m.played_at,
      schedule: m.court_number ? {
        courtNumber: m.court_number,
        startTime: m.scheduled_start_time,
        endTime: m.scheduled_end_time
      } : undefined
    }));

    // Reconstruct tournament object
    currentTournament = {
      id: tournament.id,
      teams: {
        team1: Array.from(team1Players),
        team2: Array.from(team2Players)
      },
      fixtures,
      matchesPerPlayer: tournament.matches_per_player,
      status: tournament.status,
      isSaved: true, // Tournament loaded from database is saved
      createdAt: tournament.created_at
    };

  res.json(currentTournament);
  } catch (error) {
    console.error('Error loading tournament:', error);
    res.status(500).json({ error: 'Failed to load tournament' });
  }
});

app.post('/api/tournament/create', async (req, res) => {
  try {
    const { playerIds, matchesPerPlayer = 6, courtSchedule, preview = false } = req.body;
    
    if (!playerIds || playerIds.length < 4) {
      return res.status(400).json({ error: 'At least 4 players are required for a tournament' });
    }

    // Get selected players from database
    const { data: playersData, error: playersError } = await supabase
      .from('players')
      .select('*')
      .in('id', playerIds);
    
    if (playersError) throw playersError;
    
    if (playersData.length !== playerIds.length) {
      return res.status(400).json({ error: 'Some selected players not found' });
    }

    // Transform to match expected format
    const selectedPlayers = playersData.map(p => ({
      id: p.id,
      name: p.name,
      skillLevel: p.skill_level
    }));

    // Use AI to create balanced teams
    const teams = await createBalancedTeams(selectedPlayers, matchesPerPlayer);
    
    // Generate fixtures with custom matches per player
    let fixtures = generateFixtures(teams, matchesPerPlayer);

    // Apply court scheduling if provided
    let scheduledFixtures = fixtures;
    let unscheduledCount = 0;
    if (courtSchedule && courtSchedule.timeSlots && courtSchedule.timeSlots.length > 0) {
      const { scheduled, unscheduled } = scheduleMatches(fixtures, courtSchedule);
      scheduledFixtures = [...scheduled, ...unscheduled];
      unscheduledCount = unscheduled.length;
    }

    // If preview mode, return data WITHOUT saving to database
    if (preview) {
      const previewTournament = {
        id: 'preview-' + Date.now(),
        teams,
        fixtures: scheduledFixtures,
        matchesPerPlayer,
        status: 'preview',
        isSaved: false,
        createdAt: new Date().toISOString()
      };
      
      console.log(`Tournament preview created with ${scheduledFixtures.length} matches`);
      console.log(`Team 1: ${teams.team1.length} players`);
      console.log(`Team 2: ${teams.team2.length} players`);
      console.log(`Matches per player: ${matchesPerPlayer}`);
      
      return res.json(previewTournament);
    }

    // Otherwise, save to database (production mode)

    // Create tournament in database
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .insert([
        {
          matches_per_player: matchesPerPlayer,
          status: 'active',
          court_schedule: courtSchedule || null
        }
      ])
      .select()
      .single();

    if (tournamentError) throw tournamentError;

    // Store matches in database with schedule info
    const matchesData = scheduledFixtures.map(fixture => ({
      id: fixture.id,
      tournament_id: tournament.id,
      team1_player1_id: fixture.team1[0],
      team1_player2_id: fixture.team1[1],
      team2_player1_id: fixture.team2[0],
      team2_player2_id: fixture.team2[1],
      team1_score: null,
      team2_score: null,
      winner_team: null,
      status: 'pending',
      court_number: fixture.schedule?.courtNumber || null,
      scheduled_start_time: fixture.schedule?.startTime || null,
      scheduled_end_time: fixture.schedule?.endTime || null
    }));

    const { error: matchesError } = await supabase
      .from('matches')
      .insert(matchesData);

    if (matchesError) throw matchesError;

    // Cache in memory for quick access
    currentTournament = {
      id: tournament.id,
      teams,
      fixtures: scheduledFixtures,
      matchesPerPlayer,
      status: 'active',
      isSaved: true,
      createdAt: tournament.created_at
    };

    console.log(`Tournament created with ${scheduledFixtures.length} matches`);
    console.log(`Team 1: ${teams.team1.length} players`);
    console.log(`Team 2: ${teams.team2.length} players`);
    console.log(`Matches per player: ${matchesPerPlayer}`);
    if (courtSchedule) {
      console.log(`Scheduled: ${scheduledFixtures.length - unscheduledCount} matches`);
      console.log(`Unscheduled: ${unscheduledCount} matches`);
    }

    res.json(currentTournament);
  } catch (error) {
    console.error('Error creating tournament:', error);
    res.status(500).json({ error: 'Failed to create tournament' });
  }
});

app.post('/api/tournament/save', async (req, res) => {
  try {
    const { teams, fixtures, matchesPerPlayer, courtSchedule, tournamentId } = req.body;
    
    if (!teams || !fixtures || !matchesPerPlayer) {
      return res.status(400).json({ error: 'Missing required tournament data' });
    }

    // If updating existing tournament (has tournamentId and it's a real UUID, not preview)
    if (tournamentId && !tournamentId.startsWith('preview-')) {
      // Update existing tournament
      const { data: existingTournament, error: checkError } = await supabase
        .from('tournaments')
        .select('id')
        .eq('id', tournamentId)
        .eq('status', 'active')
        .single();
      
      if (checkError || !existingTournament) {
        return res.status(404).json({ error: 'Tournament not found or not active' });
      }
      
      // Delete old matches
      const { error: deleteMatchesError } = await supabase
        .from('matches')
        .delete()
        .eq('tournament_id', tournamentId);
      
      if (deleteMatchesError) throw deleteMatchesError;
      
      // Update tournament
      const { error: updateError } = await supabase
        .from('tournaments')
        .update({
          matches_per_player: matchesPerPlayer,
          court_schedule: courtSchedule || null
        })
        .eq('id', tournamentId);
      
      if (updateError) throw updateError;
      
      // Insert new matches
      const matchesData = fixtures.map(fixture => ({
        id: fixture.id,
        tournament_id: tournamentId,
        team1_player1_id: fixture.team1[0],
        team1_player2_id: fixture.team1[1],
        team2_player1_id: fixture.team2[0],
        team2_player2_id: fixture.team2[1],
        team1_score: fixture.team1Score || null,
        team2_score: fixture.team2Score || null,
        winner_team: null,
        status: fixture.status || 'pending',
        court_number: fixture.schedule?.courtNumber || null,
        scheduled_start_time: fixture.schedule?.startTime || null,
        scheduled_end_time: fixture.schedule?.endTime || null
      }));
      
      const { error: insertMatchesError } = await supabase
        .from('matches')
        .insert(matchesData);
      
      if (insertMatchesError) throw insertMatchesError;
      
      // Cache in memory
      currentTournament = {
        id: tournamentId,
        teams,
        fixtures,
        matchesPerPlayer,
        status: 'active',
        isSaved: true,
        createdAt: existingTournament.created_at || new Date().toISOString()
      };
      
      console.log(`Tournament ${tournamentId} updated with ${fixtures.length} matches`);
      
      return res.json(currentTournament);
    }

    // Creating new tournament - check for existing active tournament
    const { data: existingTournaments, error: checkError } = await supabase
      .from('tournaments')
      .select('id')
      .eq('status', 'active');
    
    if (checkError) throw checkError;
    
    if (existingTournaments && existingTournaments.length > 0) {
      return res.status(400).json({ 
        error: 'An active tournament already exists. Please delete it first.' 
      });
    }
    
    // Create tournament in database
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .insert([{
        matches_per_player: matchesPerPlayer,
        status: 'active',
        court_schedule: courtSchedule || null
      }])
      .select()
      .single();
    
    if (tournamentError) throw tournamentError;
    
    // Store matches in database
    const matchesData = fixtures.map(fixture => ({
      id: fixture.id,
      tournament_id: tournament.id,
      team1_player1_id: fixture.team1[0],
      team1_player2_id: fixture.team1[1],
      team2_player1_id: fixture.team2[0],
      team2_player2_id: fixture.team2[1],
      team1_score: fixture.team1Score || null,
      team2_score: fixture.team2Score || null,
      winner_team: null,
      status: fixture.status || 'pending',
      court_number: fixture.schedule?.courtNumber || null,
      scheduled_start_time: fixture.schedule?.startTime || null,
      scheduled_end_time: fixture.schedule?.endTime || null
    }));
    
    const { error: matchesError } = await supabase
      .from('matches')
      .insert(matchesData);
    
    if (matchesError) throw matchesError;
    
    // Cache in memory
    currentTournament = {
      id: tournament.id,
      teams,
      fixtures,
      matchesPerPlayer,
      status: 'active',
      isSaved: true,
      createdAt: tournament.created_at
    };
    
    console.log(`Tournament saved to database with ${fixtures.length} matches`);
    
    res.json(currentTournament);
  } catch (error) {
    console.error('Error saving tournament:', error);
    res.status(500).json({ error: 'Failed to save tournament' });
  }
});

app.post('/api/tournament/regenerate', async (req, res) => {
  try {
    if (!currentTournament) {
      return res.status(400).json({ error: 'No active tournament to regenerate' });
    }

    const { matchesPerPlayer = currentTournament.matchesPerPlayer || 6 } = req.body;
    
    // Get current players from database
    const allPlayerIds = [...currentTournament.teams.team1, ...currentTournament.teams.team2];
    
    const { data: playersData, error: playersError } = await supabase
      .from('players')
      .select('*')
      .in('id', allPlayerIds);
    
    if (playersError) throw playersError;
    
    if (playersData.length !== allPlayerIds.length) {
      return res.status(400).json({ error: 'Some players not found' });
    }

    // Transform to match expected format
    const selectedPlayers = playersData.map(p => ({
      id: p.id,
      name: p.name,
      skillLevel: p.skill_level
    }));

    // Use AI to create new balanced teams
    const teams = await createBalancedTeams(selectedPlayers, matchesPerPlayer);
    
    // Generate new fixtures
    const fixtures = generateFixtures(teams, matchesPerPlayer);

    // Update current tournament
    currentTournament.teams = teams;
    currentTournament.fixtures = fixtures;
    currentTournament.matchesPerPlayer = matchesPerPlayer;
    currentTournament.regeneratedAt = new Date().toISOString();

    console.log(`Tournament regenerated with ${fixtures.length} matches`);
    console.log(`Team 1: ${teams.team1.length} players`);
    console.log(`Team 2: ${teams.team2.length} players`);
    console.log(`Matches per player: ${matchesPerPlayer}`);

    res.json(currentTournament);
  } catch (error) {
    console.error('Error regenerating tournament:', error);
    res.status(500).json({ error: 'Failed to regenerate tournament' });
  }
});

app.post('/api/tournament/swap-players', async (req, res) => {
  try {
    if (!currentTournament) {
      return res.status(400).json({ error: 'No active tournament' });
    }

    const { player1Id, player2Id } = req.body;
    
    if (!player1Id || !player2Id) {
      return res.status(400).json({ error: 'Both player IDs are required' });
    }

    if (player1Id === player2Id) {
      return res.status(400).json({ error: 'Cannot swap a player with themselves' });
    }

    // Find which teams the players are in
    const team1Index = currentTournament.teams.team1.indexOf(player1Id);
    const team2Index = currentTournament.teams.team2.indexOf(player1Id);
    const player1Team = team1Index !== -1 ? 'team1' : 'team2';
    const player1TeamIndex = team1Index !== -1 ? team1Index : team2Index;

    const team1Index2 = currentTournament.teams.team1.indexOf(player2Id);
    const team2Index2 = currentTournament.teams.team2.indexOf(player2Id);
    const player2Team = team1Index2 !== -1 ? 'team1' : 'team2';
    const player2TeamIndex = team1Index2 !== -1 ? team1Index2 : team2Index2;

    if (player1TeamIndex === -1 || player2TeamIndex === -1) {
      return res.status(400).json({ error: 'One or both players not found in tournament' });
    }

    // Perform the swap
    if (player1Team === player2Team) {
      // Same team - just swap positions
      const team = currentTournament.teams[player1Team];
      [team[player1TeamIndex], team[player2TeamIndex]] = [team[player2TeamIndex], team[player1TeamIndex]];
    } else {
      // Different teams - swap between teams
      const team1 = currentTournament.teams.team1;
      const team2 = currentTournament.teams.team2;
      
      if (player1Team === 'team1') {
        [team1[player1TeamIndex], team2[player2TeamIndex]] = [team2[player2TeamIndex], team1[player1TeamIndex]];
      } else {
        [team2[player1TeamIndex], team1[player2TeamIndex]] = [team1[player2TeamIndex], team2[player1TeamIndex]];
      }
    }

    // Regenerate fixtures with the new team composition
    const fixtures = generateFixtures(currentTournament.teams, currentTournament.matchesPerPlayer);
    currentTournament.fixtures = fixtures;
    currentTournament.swappedAt = new Date().toISOString();

    console.log(`Players swapped: ${player1Id} <-> ${player2Id}`);
    console.log(`Fixtures regenerated with ${fixtures.length} matches`);

    res.json(currentTournament);
  } catch (error) {
    console.error('Error swapping players:', error);
    res.status(500).json({ error: 'Failed to swap players' });
  }
});

app.delete('/api/tournament/delete', async (req, res) => {
  try {
    // Get active tournament from database
    const { data: tournaments, error: fetchError } = await supabase
      .from('tournaments')
      .select('id')
      .eq('status', 'active')
      .limit(1);
    
    if (fetchError) throw fetchError;
    
    if (!tournaments || tournaments.length === 0) {
      // Clear in-memory cache just in case
      currentTournament = null;
      return res.status(404).json({ error: 'No active tournament found' });
    }
    
    const tournamentId = tournaments[0].id;
    
    // Delete matches first (foreign key constraint)
    const { error: matchesError } = await supabase
      .from('matches')
      .delete()
      .eq('tournament_id', tournamentId);
    
    if (matchesError) throw matchesError;
    
    // Delete tournament
    const { error: tournamentError } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', tournamentId);
    
    if (tournamentError) throw tournamentError;
    
    // Clear in-memory cache
    currentTournament = null;
    
    console.log(`Tournament ${tournamentId} deleted successfully`);
    
    res.json({ message: 'Tournament deleted successfully' });
  } catch (error) {
    console.error('Error deleting tournament:', error);
    res.status(500).json({ error: 'Failed to delete tournament' });
  }
});

app.post('/api/tournament/score', async (req, res) => {
  try {
  const { fixtureId, team1Score, team2Score } = req.body;
  
  if (!currentTournament) {
    return res.status(400).json({ error: 'No active tournament' });
  }

  const fixture = currentTournament.fixtures.find(f => f.id === fixtureId);
  if (!fixture) {
    return res.status(404).json({ error: 'Fixture not found' });
  }

  if (fixture.status !== 'pending') {
    return res.status(400).json({ error: 'Fixture already completed' });
  }

    // Determine winner
    const winnerTeam = team1Score > team2Score ? 1 : 2;

    // Update match in database
    const { error: updateError } = await supabase
      .from('matches')
      .update({
        team1_score: team1Score,
        team2_score: team2Score,
        winner_team: winnerTeam,
        status: 'completed',
        played_at: new Date().toISOString()
      })
      .eq('id', fixtureId);

    if (updateError) throw updateError;

    // Update fixture in memory
  fixture.status = 'completed';
  fixture.team1Score = team1Score;
  fixture.team2Score = team2Score;
  fixture.winner = team1Score > team2Score ? 'team1' : 'team2';
  fixture.completedAt = new Date().toISOString();

    res.json(fixture);
  } catch (error) {
    console.error('Error updating score:', error);
    res.status(500).json({ error: 'Failed to update score' });
  }
});

app.get('/api/tournament/results', async (req, res) => {
  try {
    // If no tournament in memory, try loading from database
    if (!currentTournament) {
      const { data: tournaments, error: tournamentsError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (tournamentsError) throw tournamentsError;

      if (!tournaments || tournaments.length === 0) {
        return res.status(400).json({ error: 'No active tournament' });
      }

      const tournament = tournaments[0];

      // Load matches for this tournament
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .eq('tournament_id', tournament.id)
        .order('created_at', { ascending: true });

      if (matchesError) throw matchesError;

      if (!matches || matches.length === 0) {
        return res.status(400).json({ error: 'No active tournament' });
      }

      // Extract unique player IDs and reconstruct teams
      const team1Players = new Set();
      const team2Players = new Set();
      
      matches.forEach(match => {
        team1Players.add(match.team1_player1_id);
        team1Players.add(match.team1_player2_id);
        team2Players.add(match.team2_player1_id);
        team2Players.add(match.team2_player2_id);
      });

      // Convert matches to fixtures format
      const fixtures = matches.map(m => ({
        id: m.id,
        team1: [m.team1_player1_id, m.team1_player2_id],
        team2: [m.team2_player1_id, m.team2_player2_id],
        status: m.status,
        team1Score: m.team1_score,
        team2Score: m.team2_score,
        winner: m.winner_team === 1 ? 'team1' : m.winner_team === 2 ? 'team2' : undefined,
        completedAt: m.played_at,
        schedule: m.court_number ? {
          courtNumber: m.court_number,
          startTime: m.scheduled_start_time,
          endTime: m.scheduled_end_time
        } : undefined
      }));

      // Reconstruct tournament object and cache it
      currentTournament = {
        id: tournament.id,
        teams: {
          team1: Array.from(team1Players),
          team2: Array.from(team2Players)
        },
        fixtures,
        matchesPerPlayer: tournament.matches_per_player,
        status: tournament.status,
        isSaved: true,
        createdAt: tournament.created_at
      };
    }

    // Get all unique player IDs from the tournament
    const allPlayerIds = [...currentTournament.teams.team1, ...currentTournament.teams.team2];
    
    // Fetch player details from database
    const { data: players, error } = await supabase
      .from('players')
      .select('*')
      .in('id', allPlayerIds);
    
    if (error) {
      console.error('Error fetching players:', error);
      return res.status(500).json({ error: 'Failed to fetch player details' });
    }

    const completedFixtures = currentTournament.fixtures.filter(f => f.status === 'completed');
    const teamStats = calculateTeamStats(currentTournament.teams, completedFixtures);

    res.json({
      tournament: currentTournament,
      teamStats,
      completedFixtures,
      players: players || []
    });
  } catch (error) {
    console.error('Error in tournament results:', error);
    res.status(500).json({ error: 'Failed to get tournament results' });
  }
});

// Leaderboard Routes
app.get('/api/leaderboard/overall', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('player_statistics')
      .select('*')
      .order('win_rate', { ascending: false })
      .order('matches_won', { ascending: false });
    
    if (error) throw error;
    
    // Transform to camelCase for frontend
    const leaderboard = data.map(player => ({
      id: player.id,
      name: player.name,
      skillLevel: player.skill_level,
      matchesPlayed: player.matches_played,
      matchesWon: player.matches_won,
      matchesLost: player.matches_lost,
      winRate: player.win_rate
    }));
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching overall leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

app.get('/api/leaderboard/monthly', async (req, res) => {
  try {
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({ error: 'Year and month parameters are required' });
    }
    
    const { data, error } = await supabase
      .rpc('get_monthly_leaderboard', {
        year_param: parseInt(year),
        month_param: parseInt(month)
      });
    
    if (error) throw error;
    
    // Transform to camelCase for frontend
    const leaderboard = data.map(player => ({
      id: player.id,
      name: player.name,
      skillLevel: player.skill_level,
      matchesPlayed: player.matches_played,
      matchesWon: player.matches_won,
      matchesLost: player.matches_lost,
      winRate: player.win_rate
    }));
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching monthly leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch monthly leaderboard' });
  }
});

app.get('/api/leaderboard/weekly', async (req, res) => {
  try {
    const { year, week } = req.query;
    
    if (!year || !week) {
      return res.status(400).json({ error: 'Year and week parameters are required' });
    }
    
    const { data, error } = await supabase
      .rpc('get_weekly_leaderboard', {
        year_param: parseInt(year),
        week_param: parseInt(week)
      });
    
    if (error) throw error;
    
    // Transform to camelCase for frontend
    const leaderboard = data.map(player => ({
      id: player.id,
      name: player.name,
      skillLevel: player.skill_level,
      matchesPlayed: player.matches_played,
      matchesWon: player.matches_won,
      matchesLost: player.matches_lost,
      winRate: player.win_rate
    }));
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching weekly leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch weekly leaderboard' });
  }
});

// Helper function to reorder fixtures for better parallel scheduling
function reorderForParallelScheduling(fixtures) {
  const result = [];
  const remaining = [...fixtures];
  
  while (remaining.length > 0) {
    const batch = [];
    const usedPlayers = new Set();
    
    // Build a batch of non-conflicting matches
    for (let i = remaining.length - 1; i >= 0; i--) {
      const fixture = remaining[i];
      const players = [...fixture.team1, ...fixture.team2];
      
      // Check if any player in this match is already in the batch
      const hasConflict = players.some(p => usedPlayers.has(p));
      
      if (!hasConflict) {
        batch.push(fixture);
        players.forEach(p => usedPlayers.add(p));
        remaining.splice(i, 1);
      }
    }
    
    result.push(...batch);
  }
  
  return result;
}

// Court scheduling algorithm
function scheduleMatches(fixtures, courtSchedule) {
  if (!courtSchedule || !courtSchedule.timeSlots || courtSchedule.timeSlots.length === 0) {
    return { scheduled: [], unscheduled: fixtures };
  }

  const MATCH_DURATION = 12; // minutes
  const MIN_REST = 3; // minutes (best effort, not mandatory)

  // Convert time string "HH:MM" to minutes since midnight
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Convert minutes since midnight to time string "HH:MM"
  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  // Build time blocks with court availability
  const timeBlocks = [];
  courtSchedule.timeSlots.forEach(slot => {
    const startMin = timeToMinutes(slot.startTime);
    const endMin = timeToMinutes(slot.endTime);
    const numCourts = slot.courts;

    // Create 12-minute blocks for this time slot
    for (let time = startMin; time + MATCH_DURATION <= endMin; time += MATCH_DURATION) {
      timeBlocks.push({
        startTime: time,
        endTime: time + MATCH_DURATION,
        courts: Array(numCourts).fill(null) // null = available
      });
    }
  });

  // Track when each player's last match ends
  const playerLastMatchEnd = {};

  // Try to schedule each fixture
  const scheduled = [];
  const unscheduled = [];

  // Reorder fixtures to group non-conflicting matches together
  // This maximizes parallel court utilization
  const reorderedFixtures = reorderForParallelScheduling(fixtures);

  reorderedFixtures.forEach(fixture => {
    const players = [...fixture.team1, ...fixture.team2];
    let bestBlock = null;
    let bestCourt = null;
    let bestRestScore = -1;

    // Find the earliest available slot where all players are available
    // We prioritize filling all courts in a time block before moving to the next
    for (let blockIdx = 0; blockIdx < timeBlocks.length; blockIdx++) {
      const block = timeBlocks[blockIdx];
      const blockStart = block.startTime;
      
      // Try each court in this time block
      for (let courtIdx = 0; courtIdx < block.courts.length; courtIdx++) {
        if (block.courts[courtIdx] !== null) continue; // Court already occupied
        
        // Check if all players can play (considering rest time)
        let restScore = 0;
        let allPlayersAvailable = true;

        for (const playerId of players) {
          const lastEnd = playerLastMatchEnd[playerId] || 0;
          const restTime = blockStart - lastEnd;
          
          if (restTime < 0) {
            // Player is still playing
            allPlayersAvailable = false;
            break;
          }
          
          // Bonus for having rest time
          restScore += Math.min(restTime, MIN_REST);
        }

        if (allPlayersAvailable) {
          // Found a suitable slot - take it immediately (greedy approach)
          bestBlock = blockIdx;
          bestCourt = courtIdx;
          bestRestScore = restScore;
          break;
        }
      }
      
      // If we found a slot in this time block, stop searching
      if (bestBlock !== null) {
        break;
      }
    }

    if (bestBlock !== null) {
      // Schedule the match
      const block = timeBlocks[bestBlock];
      const courtNumber = bestCourt + 1; // 1-indexed for display
      const startTime = minutesToTime(block.startTime);
      const endTime = minutesToTime(block.endTime);

      scheduled.push({
        ...fixture,
        schedule: {
          courtNumber,
          startTime,
          endTime
        }
      });

      // Mark court as occupied
      block.courts[bestCourt] = fixture.id;

      // Update player availability
      players.forEach(playerId => {
        playerLastMatchEnd[playerId] = block.endTime;
      });
    } else {
      // Could not schedule this match
      unscheduled.push(fixture);
    }
  });

  console.log(`Scheduled ${scheduled.length} of ${fixtures.length} matches`);
  if (unscheduled.length > 0) {
    console.log(`Warning: ${unscheduled.length} matches could not be scheduled`);
  }

  return { scheduled, unscheduled };
}

// AI-powered team creation
async function createBalancedTeams(players, matchesPerPlayer = 6) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
    Create balanced teams for a badminton doubles tournament from these players:
    ${players.map(p => `${p.name} (${p.skillLevel})`).join(', ')}
    
    Rules:
    1. Split into exactly 2 teams
    2. Balance skill levels across teams
    3. Each team should have similar total skill distribution
    4. Consider that each player should get approximately ${matchesPerPlayer} matches
    5. Create teams that allow for diverse pairings and avoid repetitive matchups
    6. CRITICAL: Ensure ALL players get fair playing time - the difference in number of matches between any two players MUST be at most 1 match (e.g., if some players get 6 matches, no player should get fewer than 5 or more than 7)
    7. Optimize team composition to enable balanced match distribution where every player participates in a similar number of matches
    8. Return only the team assignments in this JSON format:
    {
      "team1": ["player1_name", "player2_name", ...],
      "team2": ["player3_name", "player4_name", ...]
    }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse AI response
    const teamData = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
    
    // Convert player names back to IDs
    const team1Ids = teamData.team1.map(name => 
      players.find(p => p.name === name)?.id
    ).filter(Boolean);
    
    const team2Ids = teamData.team2.map(name => 
      players.find(p => p.name === name)?.id
    ).filter(Boolean);

    return {
      team1: team1Ids,
      team2: team2Ids
    };
  } catch (error) {
    console.error('AI team creation failed, using fallback:', error);
    // Fallback: simple random assignment
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const mid = Math.ceil(shuffled.length / 2);
    
    return {
      team1: shuffled.slice(0, mid).map(p => p.id),
      team2: shuffled.slice(mid).map(p => p.id)
    };
  }
}

// Generate fixtures with guaranteed balanced player participation
function generateFixtures(teams, matchesPerPlayer = 6) {
  const fixtures = [];
  const team1 = teams.team1;
  const team2 = teams.team2;
  
  // Calculate target matches per player
  const targetMatchesPerPlayer = Math.min(matchesPerPlayer, Math.floor((team1.length + team2.length) * 2));
  const maxMatchesPerPlayer = targetMatchesPerPlayer + 1; // Strict cap: target + 1
  
  // Create all possible pairs for each team
  const team1Pairs = createPairs(team1);
  const team2Pairs = createPairs(team2);
  
  // Track player participation
  const playerMatchCount = new Map();
  [...team1, ...team2].forEach(playerId => {
    playerMatchCount.set(playerId, 0);
  });
  
  // Track used combinations
  const usedCombinations = new Set();
  
  // Generate fixtures using a deterministic approach
  let totalMatches = 0;
  const maxTotalMatches = Math.min(team1Pairs.length * team2Pairs.length, targetMatchesPerPlayer * (team1.length + team2.length) / 2);
  
  // Create all possible fixture combinations
  const allPossibleFixtures = [];
  for (const team1Pair of team1Pairs) {
    for (const team2Pair of team2Pairs) {
      const combinationKey = `${team1Pair.sort().join(',')}-${team2Pair.sort().join(',')}`;
      allPossibleFixtures.push({
        team1Pair,
        team2Pair,
        combinationKey
      });
    }
  }
  
  // Smart fixture selection: prioritize players with fewer matches
  const shuffledFixtures = [...allPossibleFixtures].sort(() => Math.random() - 0.5);
  
  // Add fixtures while maintaining balance
  while (shuffledFixtures.length > 0 && totalMatches < maxTotalMatches) {
    // Sort remaining fixtures by priority (prefer fixtures with players having fewer matches)
    shuffledFixtures.sort((a, b) => {
      const aPlayers = [...a.team1Pair, ...a.team2Pair];
      const bPlayers = [...b.team1Pair, ...b.team2Pair];
      
      const aMinCount = Math.min(...aPlayers.map(p => playerMatchCount.get(p)));
      const bMinCount = Math.min(...bPlayers.map(p => playerMatchCount.get(p)));
      
      // Prioritize fixtures with players who have fewer matches
      if (aMinCount !== bMinCount) return aMinCount - bMinCount;
      
      // Secondary: prefer fixtures where total count is lower
      const aTotalCount = aPlayers.reduce((sum, p) => sum + playerMatchCount.get(p), 0);
      const bTotalCount = bPlayers.reduce((sum, p) => sum + playerMatchCount.get(p), 0);
      return aTotalCount - bTotalCount;
    });
    
    let fixtureAdded = false;
    
    // Try to add the highest priority fixture that doesn't violate constraints
    for (let i = 0; i < shuffledFixtures.length; i++) {
      const fixture = shuffledFixtures[i];
      
    // Check if any player in this fixture would exceed the maximum
    const wouldExceedMax = [...fixture.team1Pair, ...fixture.team2Pair].some(playerId => 
      playerMatchCount.get(playerId) >= maxMatchesPerPlayer
    );
    
    // Check if this combination has been used
    const alreadyUsed = usedCombinations.has(fixture.combinationKey);
    
    // Only add if it doesn't exceed max and hasn't been used
      if (!wouldExceedMax && !alreadyUsed) {
      fixtures.push({
        id: uuidv4(),
        team1: fixture.team1Pair,
        team2: fixture.team2Pair,
        status: 'pending',
        team1Score: null,
        team2Score: null,
        winner: null
      });
      
      // Update player match counts
      [...fixture.team1Pair, ...fixture.team2Pair].forEach(playerId => {
        playerMatchCount.set(playerId, playerMatchCount.get(playerId) + 1);
      });
      
      usedCombinations.add(fixture.combinationKey);
      totalMatches++;
        
        // Remove this fixture from the list
        shuffledFixtures.splice(i, 1);
        fixtureAdded = true;
        break;
      } else {
        // Remove fixtures that can't be used anymore
        if (wouldExceedMax || alreadyUsed) {
          shuffledFixtures.splice(i, 1);
          i--;
        }
      }
    }
    
    // If no fixture could be added, break to avoid infinite loop
    if (!fixtureAdded) {
      console.log('No more valid fixtures can be added while maintaining balance');
      break;
    }
  }
  
  // Ensure minimum participation for players with very few matches
  // Changed from targetMatchesPerPlayer - 2 to - 1 to enforce stricter balance
  const playersWithFewMatches = [...playerMatchCount.entries()]
    .filter(([_, count]) => count < Math.max(1, targetMatchesPerPlayer - 1))
    .map(([playerId, _]) => playerId);
  
  if (playersWithFewMatches.length > 0) {
    console.log(`Ensuring minimum participation for ${playersWithFewMatches.length} players with few matches`);
    
    for (const playerId of playersWithFewMatches) {
      // Find pairs that include this player
      const team1Pair = team1Pairs.find(pair => pair.includes(playerId));
      const team2Pair = team2Pairs.find(pair => pair.includes(playerId));
      
      if (team1Pair) {
        const availableTeam2Pairs = team2Pairs.filter(pair => 
          !pair.includes(playerId) && 
          pair.every(p => playerMatchCount.get(p) < maxMatchesPerPlayer)
        );
        
        if (availableTeam2Pairs.length > 0) {
          const selectedTeam2Pair = availableTeam2Pairs[Math.floor(Math.random() * availableTeam2Pairs.length)];
          const combinationKey = `${team1Pair.sort().join(',')}-${selectedTeam2Pair.sort().join(',')}`;
          
          if (!usedCombinations.has(combinationKey)) {
            fixtures.push({
              id: uuidv4(),
              team1: team1Pair,
              team2: selectedTeam2Pair,
              status: 'pending',
              team1Score: null,
              team2Score: null,
              winner: null
            });
            
            usedCombinations.add(combinationKey);
            
            // Update player match counts
            [...team1Pair, ...selectedTeam2Pair].forEach(playerId => {
              playerMatchCount.set(playerId, playerMatchCount.get(playerId) + 1);
            });
          }
        }
      } else if (team2Pair) {
        const availableTeam1Pairs = team1Pairs.filter(pair => 
          !pair.includes(playerId) && 
          pair.every(p => playerMatchCount.get(p) < maxMatchesPerPlayer)
        );
        
        if (availableTeam1Pairs.length > 0) {
          const selectedTeam1Pair = availableTeam1Pairs[Math.floor(Math.random() * availableTeam1Pairs.length)];
          const combinationKey = `${selectedTeam1Pair.sort().join(',')}-${team2Pair.sort().join(',')}`;
          
          if (!usedCombinations.has(combinationKey)) {
            fixtures.push({
              id: uuidv4(),
              team1: selectedTeam1Pair,
              team2: team2Pair,
              status: 'pending',
              team1Score: null,
              team2Score: null,
              winner: null
            });
            
            usedCombinations.add(combinationKey);
            
            // Update player match counts
            [...selectedTeam1Pair, ...team2Pair].forEach(playerId => {
              playerMatchCount.set(playerId, playerMatchCount.get(playerId) + 1);
            });
          }
        }
      }
    }
  }
  
  // Final balancing pass: ensure difference is at most 1 match between any two players
  let minMatches = Math.min(...playerMatchCount.values());
  let maxMatches = Math.max(...playerMatchCount.values());
  
  console.log(`Initial distribution - Min: ${minMatches}, Max: ${maxMatches}, Difference: ${maxMatches - minMatches}`);
  
  // Keep trying to balance until difference is at most 1
  let balancingAttempts = 0;
  const maxBalancingAttempts = 100; // Prevent infinite loops
  
  while (maxMatches - minMatches > 1 && balancingAttempts < maxBalancingAttempts) {
    balancingAttempts++;
    console.log(`Balancing attempt ${balancingAttempts}: Min: ${minMatches}, Max: ${maxMatches}, Difference: ${maxMatches - minMatches}`);
    
    // Find players with the fewest matches
    const playersWithMinMatches = [...playerMatchCount.entries()]
      .filter(([_, count]) => count === minMatches)
      .map(([playerId, _]) => playerId);
    
    let matchAdded = false;
    
    // Try to add matches for each player with minimum matches
    for (const playerId of playersWithMinMatches) {
      const currentCount = playerMatchCount.get(playerId);
      
      // Find which team this player is on
      const isInTeam1 = team1.includes(playerId);
      const playerTeam = isInTeam1 ? team1 : team2;
      const opposingTeam = isInTeam1 ? team2 : team1;
      
      // Sort potential partners by their match count (prefer partners with fewer matches)
      const sortedPartners = playerTeam
        .filter(pId => pId !== playerId)
        .sort((a, b) => playerMatchCount.get(a) - playerMatchCount.get(b));
      
      // Try each potential partner
      for (const partnerId of sortedPartners) {
        const partnerCount = playerMatchCount.get(partnerId);
        
        // Be more lenient: allow partner to have up to maxMatches (not maxMatchesPerPlayer)
        if (partnerCount > maxMatches) continue;
        
        const pair = [playerId, partnerId];
        
        // Sort potential opposing pairs by their combined match count
        const opposingPairOptions = [];
        for (let i = 0; i < opposingTeam.length; i++) {
          for (let j = i + 1; j < opposingTeam.length; j++) {
            const opp1Count = playerMatchCount.get(opposingTeam[i]);
            const opp2Count = playerMatchCount.get(opposingTeam[j]);
            
            // Be more lenient here too - allow up to maxMatches
            if (opp1Count <= maxMatches && opp2Count <= maxMatches) {
              opposingPairOptions.push({
                pair: [opposingTeam[i], opposingTeam[j]],
                totalCount: opp1Count + opp2Count
              });
            }
          }
        }
        
        // Sort by total count (prefer pairs with fewer combined matches)
        opposingPairOptions.sort((a, b) => a.totalCount - b.totalCount);
        
        // Try each opposing pair
        for (const oppOption of opposingPairOptions) {
          const opposingPair = oppOption.pair;
          
          // Check if this combination hasn't been used
          const combinationKey = isInTeam1 ? 
            `${[...pair].sort().join(',')}-${[...opposingPair].sort().join(',')}` :
            `${[...opposingPair].sort().join(',')}-${[...pair].sort().join(',')}`;
          
          if (!usedCombinations.has(combinationKey)) {
            // Add this fixture
            fixtures.push({
              id: uuidv4(),
              team1: isInTeam1 ? pair : opposingPair,
              team2: isInTeam1 ? opposingPair : pair,
              status: 'pending',
              team1Score: null,
              team2Score: null,
              winner: null
            });
            
            // Update counts
            [...pair, ...opposingPair].forEach(pId => {
              playerMatchCount.set(pId, playerMatchCount.get(pId) + 1);
            });
            
            usedCombinations.add(combinationKey);
            console.log(`Added balancing match for player ${playerId}, now has ${playerMatchCount.get(playerId)} matches`);
            
            matchAdded = true;
            break; // Move to next player with min matches
          }
        }
        
        if (matchAdded) break; // Move to next player
      }
      
      if (matchAdded) break; // Recalculate min/max and try again
    }
    
    // If we couldn't add any match, we're stuck - break out
    if (!matchAdded) {
      console.log('Could not find any valid match to add for balancing');
      break;
    }
    
    // Recalculate min/max after adding matches
    minMatches = Math.min(...playerMatchCount.values());
    maxMatches = Math.max(...playerMatchCount.values());
  }
  
  // Final stats
  const finalMinMatches = Math.min(...playerMatchCount.values());
  const finalMaxMatches = Math.max(...playerMatchCount.values());
  console.log(`After balancing (${balancingAttempts} attempts) - Min: ${finalMinMatches}, Max: ${finalMaxMatches}, Difference: ${finalMaxMatches - finalMinMatches}`);
  
  console.log(`Generated ${fixtures.length} matches with guaranteed balanced player participation`);
  console.log(`Target matches per player: ${targetMatchesPerPlayer}, Max matches per player: ${maxMatchesPerPlayer}`);
  
  // Log player participation for debugging
  logPlayerParticipation(fixtures, team1, team2);
  
  return fixtures;
}

function logPlayerParticipation(fixtures, team1, team2) {
  const playerCounts = new Map();
  
  // Count matches for each player
  fixtures.forEach(fixture => {
    [...fixture.team1, ...fixture.team2].forEach(playerId => {
      playerCounts.set(playerId, (playerCounts.get(playerId) || 0) + 1);
    });
  });
  
  console.log('Player participation:');
  [...team1, ...team2].forEach(playerId => {
    const count = playerCounts.get(playerId) || 0;
    console.log(`Player ${playerId}: ${count} matches`);
  });
}

function createPairs(team) {
  const pairs = [];
  for (let i = 0; i < team.length; i++) {
    for (let j = i + 1; j < team.length; j++) {
      pairs.push([team[i], team[j]]);
    }
  }
  return pairs;
}

function calculateTeamStats(teams, completedFixtures) {
  const team1Wins = completedFixtures.filter(f => f.winner === 'team1').length;
  const team2Wins = completedFixtures.filter(f => f.winner === 'team2').length;
  
  return {
    team1: { wins: team1Wins, players: teams.team1 },
    team2: { wins: team2Wins, players: teams.team2 }
  };
}

function findChampion(players) {
  return players.reduce((champion, player) => {
    if (!champion || player.matchesWon > champion.matchesWon) {
      return player;
    }
    return champion;
  }, null);
}

app.get('/api/test-fixtures', (req, res) => {
  // Test the fixture generation algorithm
  const testTeams = {
    team1: ['player1', 'player2', 'player3', 'player4', 'player5'],
    team2: ['player6', 'player7', 'player8', 'player9', 'player10']
  };
  
  const fixtures = generateFixtures(testTeams, 6);
  
  res.json({
    message: 'Test fixture generation',
    teams: testTeams,
    fixtures: fixtures,
    totalMatches: fixtures.length
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
