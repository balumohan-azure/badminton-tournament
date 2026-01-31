export interface Player {
  id: string;
  name: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  matchesPlayed: number;
  matchesWon: number;
}

export interface TimeSlot {
  id: string;
  startTime: string;  // "06:00"
  endTime: string;    // "07:00"
  courts: number;     // Number of courts available
}

export interface CourtSchedule {
  timeSlots: TimeSlot[];
}

export interface ScheduledMatch {
  courtNumber: number;
  startTime: string;  // "06:15"
  endTime: string;    // "06:27"
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
  schedule?: ScheduledMatch;  // Optional - only if scheduled
}

export interface Tournament {
  id: string;
  teams: {
    team1: string[];
    team2: string[];
  };
  fixtures: Fixture[];
  matchesPerPlayer: number;
  status: 'preview' | 'active' | 'completed';
  isSaved: boolean;
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
  players: Player[];
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
