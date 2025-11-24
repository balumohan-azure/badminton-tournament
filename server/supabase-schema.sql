-- Badminton Tournament Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Players Table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    skill_level TEXT NOT NULL CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tournaments Table
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    matches_per_player INTEGER DEFAULT 6,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Matches Table
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    team1_player1_id UUID REFERENCES players(id) ON DELETE CASCADE,
    team1_player2_id UUID REFERENCES players(id) ON DELETE CASCADE,
    team2_player1_id UUID REFERENCES players(id) ON DELETE CASCADE,
    team2_player2_id UUID REFERENCES players(id) ON DELETE CASCADE,
    team1_score INTEGER,
    team2_score INTEGER,
    winner_team INTEGER CHECK (winner_team IN (1, 2)),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    played_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX idx_matches_played_at ON matches(played_at);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_tournaments_status ON tournaments(status);

-- Player Statistics View (for leaderboards)
CREATE OR REPLACE VIEW player_statistics AS
SELECT 
    p.id,
    p.name,
    p.skill_level,
    COUNT(DISTINCT m.id) AS matches_played,
    COUNT(DISTINCT CASE 
        WHEN (m.team1_player1_id = p.id OR m.team1_player2_id = p.id) AND m.winner_team = 1 THEN m.id
        WHEN (m.team2_player1_id = p.id OR m.team2_player2_id = p.id) AND m.winner_team = 2 THEN m.id
    END) AS matches_won,
    COUNT(DISTINCT CASE 
        WHEN (m.team1_player1_id = p.id OR m.team1_player2_id = p.id) AND m.winner_team = 2 THEN m.id
        WHEN (m.team2_player1_id = p.id OR m.team2_player2_id = p.id) AND m.winner_team = 1 THEN m.id
    END) AS matches_lost,
    CASE 
        WHEN COUNT(DISTINCT m.id) > 0 THEN 
            ROUND((COUNT(DISTINCT CASE 
                WHEN (m.team1_player1_id = p.id OR m.team1_player2_id = p.id) AND m.winner_team = 1 THEN m.id
                WHEN (m.team2_player1_id = p.id OR m.team2_player2_id = p.id) AND m.winner_team = 2 THEN m.id
            END)::NUMERIC / COUNT(DISTINCT m.id)::NUMERIC * 100), 2)
        ELSE 0
    END AS win_rate
FROM players p
LEFT JOIN matches m ON (
    (m.team1_player1_id = p.id OR m.team1_player2_id = p.id OR 
     m.team2_player1_id = p.id OR m.team2_player2_id = p.id)
    AND m.status = 'completed'
)
GROUP BY p.id, p.name, p.skill_level;

-- Function to get weekly leaderboard
CREATE OR REPLACE FUNCTION get_weekly_leaderboard(year_param INT, week_param INT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    skill_level TEXT,
    matches_played BIGINT,
    matches_won BIGINT,
    matches_lost BIGINT,
    win_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.skill_level,
        COUNT(DISTINCT m.id) AS matches_played,
        COUNT(DISTINCT CASE 
            WHEN (m.team1_player1_id = p.id OR m.team1_player2_id = p.id) AND m.winner_team = 1 THEN m.id
            WHEN (m.team2_player1_id = p.id OR m.team2_player2_id = p.id) AND m.winner_team = 2 THEN m.id
        END) AS matches_won,
        COUNT(DISTINCT CASE 
            WHEN (m.team1_player1_id = p.id OR m.team1_player2_id = p.id) AND m.winner_team = 2 THEN m.id
            WHEN (m.team2_player1_id = p.id OR m.team2_player2_id = p.id) AND m.winner_team = 1 THEN m.id
        END) AS matches_lost,
        CASE 
            WHEN COUNT(DISTINCT m.id) > 0 THEN 
                ROUND((COUNT(DISTINCT CASE 
                    WHEN (m.team1_player1_id = p.id OR m.team1_player2_id = p.id) AND m.winner_team = 1 THEN m.id
                    WHEN (m.team2_player1_id = p.id OR m.team2_player2_id = p.id) AND m.winner_team = 2 THEN m.id
                END)::NUMERIC / COUNT(DISTINCT m.id)::NUMERIC * 100), 2)
            ELSE 0
        END AS win_rate
    FROM players p
    LEFT JOIN matches m ON (
        (m.team1_player1_id = p.id OR m.team1_player2_id = p.id OR 
         m.team2_player1_id = p.id OR m.team2_player2_id = p.id)
        AND m.status = 'completed'
        AND EXTRACT(YEAR FROM m.played_at) = year_param
        AND EXTRACT(WEEK FROM m.played_at) = week_param
    )
    GROUP BY p.id, p.name, p.skill_level
    HAVING COUNT(DISTINCT m.id) > 0
    ORDER BY win_rate DESC, matches_won DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get monthly leaderboard
CREATE OR REPLACE FUNCTION get_monthly_leaderboard(year_param INT, month_param INT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    skill_level TEXT,
    matches_played BIGINT,
    matches_won BIGINT,
    matches_lost BIGINT,
    win_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.skill_level,
        COUNT(DISTINCT m.id) AS matches_played,
        COUNT(DISTINCT CASE 
            WHEN (m.team1_player1_id = p.id OR m.team1_player2_id = p.id) AND m.winner_team = 1 THEN m.id
            WHEN (m.team2_player1_id = p.id OR m.team2_player2_id = p.id) AND m.winner_team = 2 THEN m.id
        END) AS matches_won,
        COUNT(DISTINCT CASE 
            WHEN (m.team1_player1_id = p.id OR m.team1_player2_id = p.id) AND m.winner_team = 2 THEN m.id
            WHEN (m.team2_player1_id = p.id OR m.team2_player2_id = p.id) AND m.winner_team = 1 THEN m.id
        END) AS matches_lost,
        CASE 
            WHEN COUNT(DISTINCT m.id) > 0 THEN 
                ROUND((COUNT(DISTINCT CASE 
                    WHEN (m.team1_player1_id = p.id OR m.team1_player2_id = p.id) AND m.winner_team = 1 THEN m.id
                    WHEN (m.team2_player1_id = p.id OR m.team2_player2_id = p.id) AND m.winner_team = 2 THEN m.id
                END)::NUMERIC / COUNT(DISTINCT m.id)::NUMERIC * 100), 2)
            ELSE 0
        END AS win_rate
    FROM players p
    LEFT JOIN matches m ON (
        (m.team1_player1_id = p.id OR m.team1_player2_id = p.id OR 
         m.team2_player1_id = p.id OR m.team2_player2_id = p.id)
        AND m.status = 'completed'
        AND EXTRACT(YEAR FROM m.played_at) = year_param
        AND EXTRACT(MONTH FROM m.played_at) = month_param
    )
    GROUP BY p.id, p.name, p.skill_level
    HAVING COUNT(DISTINCT m.id) > 0
    ORDER BY win_rate DESC, matches_won DESC;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS) - optional but recommended
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your security needs)
CREATE POLICY "Enable read access for all users" ON players FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON players FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON players FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON tournaments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON tournaments FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON tournaments FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON matches FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON matches FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON matches FOR DELETE USING (true);

