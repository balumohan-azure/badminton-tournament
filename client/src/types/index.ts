export interface Player {
  id: string;
  name: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  matchesPlayed: number;
  matchesWon: number;
}

export interface Fixture {
  id: string;
  team1: string[];
  team2: string[];
  status: 'pending' | 'completed';
  team1Score?: number;
  team2Score?: number;
  winner?: 'team1' | 'team2';
  completedAt?: string;
}

export interface Tournament {
  id: string;
  teams: {
    team1: string[];
    team2: string[];
  };
  fixtures: Fixture[];
  matchesPerPlayer: number;
  status: 'active' | 'completed';
  createdAt: string;
  regeneratedAt?: string;
  swappedAt?: string;
}

export interface TeamStats {
  team1: {
    wins: number;
    players: string[];
  };
  team2: {
    wins: number;
    players: string[];
  };
}

export interface TournamentResults {
  tournament: Tournament;
  teamStats: TeamStats;
  champion: Player | null;
  completedFixtures: Fixture[];
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  winRate: number;
}

