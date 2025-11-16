import axios from 'axios';
import { Player, Tournament, TournamentResults, LeaderboardEntry } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const playerService = {
  getPlayers: async (): Promise<Player[]> => {
    const response = await api.get('/players');
    return response.data;
  },

  addPlayer: async (name: string, skillLevel: string): Promise<Player> => {
    const response = await api.post('/players', { name, skillLevel });
    return response.data;
  },

  deletePlayer: async (id: string): Promise<void> => {
    await api.delete(`/players/${id}`);
  },
};

export const tournamentService = {
  getCurrentTournament: async (): Promise<Tournament | null> => {
    try {
      const response = await api.get('/tournament/current');
      return response.data;
    } catch (error) {
      return null;
    }
  },

  createTournament: async (playerIds: string[], matchesPerPlayer: number = 6): Promise<Tournament> => {
    const response = await api.post('/tournament/create', { playerIds, matchesPerPlayer });
    return response.data;
  },

  regenerateTournament: async (matchesPerPlayer: number = 6): Promise<Tournament> => {
    const response = await api.post('/tournament/regenerate', { matchesPerPlayer });
    return response.data;
  },

  swapPlayers: async (player1Id: string, player2Id: string): Promise<Tournament> => {
    const response = await api.post('/tournament/swap-players', { player1Id, player2Id });
    return response.data;
  },

  submitScore: async (fixtureId: string, team1Score: number, team2Score: number): Promise<any> => {
    const response = await api.post('/tournament/score', {
      fixtureId,
      team1Score,
      team2Score,
    });
    return response.data;
  },

  getTournamentResults: async (): Promise<TournamentResults> => {
    const response = await api.get('/tournament/results');
    return response.data;
  },
};

export const leaderboardService = {
  getOverallLeaderboard: async (): Promise<LeaderboardEntry[]> => {
    const response = await api.get('/leaderboard/overall');
    return response.data;
  },

  getMonthlyLeaderboard: async (year: number, month: number): Promise<LeaderboardEntry[]> => {
    const response = await api.get('/leaderboard/monthly', {
      params: { year, month },
    });
    return response.data;
  },

  getWeeklyLeaderboard: async (year: number, week: number): Promise<LeaderboardEntry[]> => {
    const response = await api.get('/leaderboard/weekly', {
      params: { year, week },
    });
    return response.data;
  },
};

