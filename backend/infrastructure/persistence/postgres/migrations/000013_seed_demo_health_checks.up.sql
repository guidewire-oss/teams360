-- Seed demo health check sessions and responses for VP's supervised teams
-- This provides realistic demo data across multiple assessment periods

-- Helper: Teams supervised by VP are: team-phoenix, team-dragon, team-titan, team-falcon, team-eagle
-- Users associated with these teams: demo (member), alice, bob, etc.

-- Phoenix Squad - Health Check Sessions for multiple periods
INSERT INTO health_check_sessions (id, team_id, user_id, date, assessment_period, completed) VALUES
('demo-session-phoenix-2024h1-1', 'team-phoenix', 'demo', '2024-03-15', '2024 - 1st Half', true),
('demo-session-phoenix-2024h1-2', 'team-phoenix', 'alice', '2024-04-01', '2024 - 1st Half', true),
('demo-session-phoenix-2024h2-1', 'team-phoenix', 'demo', '2024-09-15', '2024 - 2nd Half', true),
('demo-session-phoenix-2024h2-2', 'team-phoenix', 'alice', '2024-10-01', '2024 - 2nd Half', true),
('demo-session-phoenix-2025h1-1', 'team-phoenix', 'demo', '2025-02-15', '2025 - 1st Half', true)
ON CONFLICT (id) DO NOTHING;

-- Dragon Squad - Health Check Sessions
INSERT INTO health_check_sessions (id, team_id, user_id, date, assessment_period, completed) VALUES
('demo-session-dragon-2024h1-1', 'team-dragon', 'bob', '2024-03-20', '2024 - 1st Half', true),
('demo-session-dragon-2024h2-1', 'team-dragon', 'bob', '2024-09-20', '2024 - 2nd Half', true),
('demo-session-dragon-2024h2-2', 'team-dragon', 'carol', '2024-10-05', '2024 - 2nd Half', true),
('demo-session-dragon-2025h1-1', 'team-dragon', 'bob', '2025-02-20', '2025 - 1st Half', true)
ON CONFLICT (id) DO NOTHING;

-- Titan Squad - Health Check Sessions
INSERT INTO health_check_sessions (id, team_id, user_id, date, assessment_period, completed) VALUES
('demo-session-titan-2024h1-1', 'team-titan', 'david', '2024-04-10', '2024 - 1st Half', true),
('demo-session-titan-2024h2-1', 'team-titan', 'david', '2024-10-10', '2024 - 2nd Half', true),
('demo-session-titan-2025h1-1', 'team-titan', 'david', '2025-03-01', '2025 - 1st Half', true)
ON CONFLICT (id) DO NOTHING;

-- Falcon Squad - Health Check Sessions
INSERT INTO health_check_sessions (id, team_id, user_id, date, assessment_period, completed) VALUES
('demo-session-falcon-2024h1-1', 'team-falcon', 'eve', '2024-03-25', '2024 - 1st Half', true),
('demo-session-falcon-2024h2-1', 'team-falcon', 'eve', '2024-09-25', '2024 - 2nd Half', true),
('demo-session-falcon-2025h1-1', 'team-falcon', 'eve', '2025-02-25', '2025 - 1st Half', true)
ON CONFLICT (id) DO NOTHING;

-- Eagle Squad - Health Check Sessions
INSERT INTO health_check_sessions (id, team_id, user_id, date, assessment_period, completed) VALUES
('demo-session-eagle-2024h1-1', 'team-eagle', 'frank', '2024-04-05', '2024 - 1st Half', true),
('demo-session-eagle-2024h2-1', 'team-eagle', 'frank', '2024-10-15', '2024 - 2nd Half', true),
('demo-session-eagle-2025h1-1', 'team-eagle', 'frank', '2025-03-05', '2025 - 1st Half', true)
ON CONFLICT (id) DO NOTHING;

-- Helper function to insert all 11 dimension responses for a session
-- (Score: 1=red, 2=yellow, 3=green | Trend: improving, stable, declining)

-- Phoenix Squad Responses - 2024 H1 Session 1 (Good health team)
INSERT INTO health_check_responses (session_id, dimension_id, score, trend, comment) VALUES
('demo-session-phoenix-2024h1-1', 'mission', 3, 'stable', 'Clear direction'),
('demo-session-phoenix-2024h1-1', 'value', 3, 'improving', 'Delivering great value'),
('demo-session-phoenix-2024h1-1', 'speed', 2, 'stable', 'Could be faster'),
('demo-session-phoenix-2024h1-1', 'fun', 3, 'stable', 'Great team atmosphere'),
('demo-session-phoenix-2024h1-1', 'health', 2, 'improving', 'Working on tech debt'),
('demo-session-phoenix-2024h1-1', 'learning', 3, 'stable', 'Always learning'),
('demo-session-phoenix-2024h1-1', 'support', 3, 'stable', 'Good support structure'),
('demo-session-phoenix-2024h1-1', 'pawns', 3, 'stable', 'We make decisions'),
('demo-session-phoenix-2024h1-1', 'release', 2, 'improving', 'Getting easier'),
('demo-session-phoenix-2024h1-1', 'process', 3, 'stable', 'Process works well'),
('demo-session-phoenix-2024h1-1', 'teamwork', 3, 'stable', 'Great collaboration')
ON CONFLICT DO NOTHING;

-- Phoenix Squad Responses - 2024 H1 Session 2
INSERT INTO health_check_responses (session_id, dimension_id, score, trend, comment) VALUES
('demo-session-phoenix-2024h1-2', 'mission', 3, 'stable', NULL),
('demo-session-phoenix-2024h1-2', 'value', 3, 'stable', NULL),
('demo-session-phoenix-2024h1-2', 'speed', 3, 'improving', 'Better velocity'),
('demo-session-phoenix-2024h1-2', 'fun', 3, 'stable', NULL),
('demo-session-phoenix-2024h1-2', 'health', 2, 'stable', NULL),
('demo-session-phoenix-2024h1-2', 'learning', 3, 'stable', NULL),
('demo-session-phoenix-2024h1-2', 'support', 3, 'stable', NULL),
('demo-session-phoenix-2024h1-2', 'pawns', 3, 'stable', NULL),
('demo-session-phoenix-2024h1-2', 'release', 2, 'stable', NULL),
('demo-session-phoenix-2024h1-2', 'process', 3, 'stable', NULL),
('demo-session-phoenix-2024h1-2', 'teamwork', 3, 'stable', NULL)
ON CONFLICT DO NOTHING;

-- Phoenix Squad Responses - 2024 H2 Session 1
INSERT INTO health_check_responses (session_id, dimension_id, score, trend, comment) VALUES
('demo-session-phoenix-2024h2-1', 'mission', 3, 'stable', NULL),
('demo-session-phoenix-2024h2-1', 'value', 3, 'stable', NULL),
('demo-session-phoenix-2024h2-1', 'speed', 3, 'stable', NULL),
('demo-session-phoenix-2024h2-1', 'fun', 3, 'stable', NULL),
('demo-session-phoenix-2024h2-1', 'health', 3, 'improving', 'Paid off tech debt'),
('demo-session-phoenix-2024h2-1', 'learning', 3, 'stable', NULL),
('demo-session-phoenix-2024h2-1', 'support', 3, 'stable', NULL),
('demo-session-phoenix-2024h2-1', 'pawns', 3, 'stable', NULL),
('demo-session-phoenix-2024h2-1', 'release', 3, 'improving', 'CI/CD improved'),
('demo-session-phoenix-2024h2-1', 'process', 3, 'stable', NULL),
('demo-session-phoenix-2024h2-1', 'teamwork', 3, 'stable', NULL)
ON CONFLICT DO NOTHING;

-- Phoenix Squad Responses - 2024 H2 Session 2
INSERT INTO health_check_responses (session_id, dimension_id, score, trend, comment) VALUES
('demo-session-phoenix-2024h2-2', 'mission', 3, 'stable', NULL),
('demo-session-phoenix-2024h2-2', 'value', 3, 'stable', NULL),
('demo-session-phoenix-2024h2-2', 'speed', 3, 'stable', NULL),
('demo-session-phoenix-2024h2-2', 'fun', 2, 'declining', 'Crunch time'),
('demo-session-phoenix-2024h2-2', 'health', 3, 'stable', NULL),
('demo-session-phoenix-2024h2-2', 'learning', 3, 'stable', NULL),
('demo-session-phoenix-2024h2-2', 'support', 3, 'stable', NULL),
('demo-session-phoenix-2024h2-2', 'pawns', 3, 'stable', NULL),
('demo-session-phoenix-2024h2-2', 'release', 3, 'stable', NULL),
('demo-session-phoenix-2024h2-2', 'process', 3, 'stable', NULL),
('demo-session-phoenix-2024h2-2', 'teamwork', 3, 'stable', NULL)
ON CONFLICT DO NOTHING;

-- Phoenix Squad Responses - 2025 H1 Session 1
INSERT INTO health_check_responses (session_id, dimension_id, score, trend, comment) VALUES
('demo-session-phoenix-2025h1-1', 'mission', 3, 'stable', NULL),
('demo-session-phoenix-2025h1-1', 'value', 3, 'stable', NULL),
('demo-session-phoenix-2025h1-1', 'speed', 3, 'stable', NULL),
('demo-session-phoenix-2025h1-1', 'fun', 3, 'improving', 'Recovered'),
('demo-session-phoenix-2025h1-1', 'health', 3, 'stable', NULL),
('demo-session-phoenix-2025h1-1', 'learning', 3, 'stable', NULL),
('demo-session-phoenix-2025h1-1', 'support', 3, 'stable', NULL),
('demo-session-phoenix-2025h1-1', 'pawns', 3, 'stable', NULL),
('demo-session-phoenix-2025h1-1', 'release', 3, 'stable', NULL),
('demo-session-phoenix-2025h1-1', 'process', 3, 'stable', NULL),
('demo-session-phoenix-2025h1-1', 'teamwork', 3, 'stable', NULL)
ON CONFLICT DO NOTHING;

-- Dragon Squad Responses - 2024 H1 (Struggling team)
INSERT INTO health_check_responses (session_id, dimension_id, score, trend, comment) VALUES
('demo-session-dragon-2024h1-1', 'mission', 2, 'declining', 'Unclear priorities'),
('demo-session-dragon-2024h1-1', 'value', 2, 'declining', 'Value unclear'),
('demo-session-dragon-2024h1-1', 'speed', 1, 'declining', 'Very slow'),
('demo-session-dragon-2024h1-1', 'fun', 1, 'declining', 'Stressful'),
('demo-session-dragon-2024h1-1', 'health', 1, 'declining', 'Tech debt mountain'),
('demo-session-dragon-2024h1-1', 'learning', 2, 'stable', NULL),
('demo-session-dragon-2024h1-1', 'support', 2, 'stable', NULL),
('demo-session-dragon-2024h1-1', 'pawns', 1, 'declining', 'No autonomy'),
('demo-session-dragon-2024h1-1', 'release', 1, 'declining', 'Releases scary'),
('demo-session-dragon-2024h1-1', 'process', 2, 'stable', NULL),
('demo-session-dragon-2024h1-1', 'teamwork', 2, 'stable', NULL)
ON CONFLICT DO NOTHING;

-- Dragon Squad Responses - 2024 H2 Session 1 (Improving)
INSERT INTO health_check_responses (session_id, dimension_id, score, trend, comment) VALUES
('demo-session-dragon-2024h2-1', 'mission', 2, 'improving', 'Getting clearer'),
('demo-session-dragon-2024h2-1', 'value', 2, 'stable', NULL),
('demo-session-dragon-2024h2-1', 'speed', 2, 'improving', 'Better'),
('demo-session-dragon-2024h2-1', 'fun', 2, 'improving', 'Less stress'),
('demo-session-dragon-2024h2-1', 'health', 2, 'improving', 'Tackling debt'),
('demo-session-dragon-2024h2-1', 'learning', 2, 'stable', NULL),
('demo-session-dragon-2024h2-1', 'support', 3, 'improving', 'Got help'),
('demo-session-dragon-2024h2-1', 'pawns', 2, 'improving', 'More voice'),
('demo-session-dragon-2024h2-1', 'release', 2, 'improving', 'Better process'),
('demo-session-dragon-2024h2-1', 'process', 2, 'stable', NULL),
('demo-session-dragon-2024h2-1', 'teamwork', 3, 'improving', 'Bonding')
ON CONFLICT DO NOTHING;

-- Dragon Squad Responses - 2024 H2 Session 2
INSERT INTO health_check_responses (session_id, dimension_id, score, trend, comment) VALUES
('demo-session-dragon-2024h2-2', 'mission', 3, 'improving', NULL),
('demo-session-dragon-2024h2-2', 'value', 2, 'stable', NULL),
('demo-session-dragon-2024h2-2', 'speed', 2, 'stable', NULL),
('demo-session-dragon-2024h2-2', 'fun', 2, 'stable', NULL),
('demo-session-dragon-2024h2-2', 'health', 2, 'stable', NULL),
('demo-session-dragon-2024h2-2', 'learning', 3, 'improving', NULL),
('demo-session-dragon-2024h2-2', 'support', 3, 'stable', NULL),
('demo-session-dragon-2024h2-2', 'pawns', 2, 'stable', NULL),
('demo-session-dragon-2024h2-2', 'release', 2, 'stable', NULL),
('demo-session-dragon-2024h2-2', 'process', 3, 'improving', NULL),
('demo-session-dragon-2024h2-2', 'teamwork', 3, 'stable', NULL)
ON CONFLICT DO NOTHING;

-- Dragon Squad Responses - 2025 H1 (Much better)
INSERT INTO health_check_responses (session_id, dimension_id, score, trend, comment) VALUES
('demo-session-dragon-2025h1-1', 'mission', 3, 'stable', NULL),
('demo-session-dragon-2025h1-1', 'value', 3, 'improving', NULL),
('demo-session-dragon-2025h1-1', 'speed', 3, 'improving', NULL),
('demo-session-dragon-2025h1-1', 'fun', 3, 'improving', NULL),
('demo-session-dragon-2025h1-1', 'health', 3, 'improving', 'Debt cleared'),
('demo-session-dragon-2025h1-1', 'learning', 3, 'stable', NULL),
('demo-session-dragon-2025h1-1', 'support', 3, 'stable', NULL),
('demo-session-dragon-2025h1-1', 'pawns', 3, 'improving', NULL),
('demo-session-dragon-2025h1-1', 'release', 3, 'improving', NULL),
('demo-session-dragon-2025h1-1', 'process', 3, 'stable', NULL),
('demo-session-dragon-2025h1-1', 'teamwork', 3, 'stable', NULL)
ON CONFLICT DO NOTHING;

-- Titan Squad Responses - 2024 H1 (Average team)
INSERT INTO health_check_responses (session_id, dimension_id, score, trend, comment) VALUES
('demo-session-titan-2024h1-1', 'mission', 2, 'stable', NULL),
('demo-session-titan-2024h1-1', 'value', 3, 'stable', NULL),
('demo-session-titan-2024h1-1', 'speed', 2, 'stable', NULL),
('demo-session-titan-2024h1-1', 'fun', 2, 'stable', NULL),
('demo-session-titan-2024h1-1', 'health', 2, 'stable', NULL),
('demo-session-titan-2024h1-1', 'learning', 2, 'stable', NULL),
('demo-session-titan-2024h1-1', 'support', 2, 'stable', NULL),
('demo-session-titan-2024h1-1', 'pawns', 2, 'stable', NULL),
('demo-session-titan-2024h1-1', 'release', 2, 'stable', NULL),
('demo-session-titan-2024h1-1', 'process', 2, 'stable', NULL),
('demo-session-titan-2024h1-1', 'teamwork', 2, 'stable', NULL)
ON CONFLICT DO NOTHING;

-- Titan Squad Responses - 2024 H2
INSERT INTO health_check_responses (session_id, dimension_id, score, trend, comment) VALUES
('demo-session-titan-2024h2-1', 'mission', 3, 'improving', NULL),
('demo-session-titan-2024h2-1', 'value', 3, 'stable', NULL),
('demo-session-titan-2024h2-1', 'speed', 2, 'stable', NULL),
('demo-session-titan-2024h2-1', 'fun', 2, 'stable', NULL),
('demo-session-titan-2024h2-1', 'health', 2, 'stable', NULL),
('demo-session-titan-2024h2-1', 'learning', 3, 'improving', NULL),
('demo-session-titan-2024h2-1', 'support', 2, 'stable', NULL),
('demo-session-titan-2024h2-1', 'pawns', 2, 'stable', NULL),
('demo-session-titan-2024h2-1', 'release', 2, 'stable', NULL),
('demo-session-titan-2024h2-1', 'process', 3, 'improving', NULL),
('demo-session-titan-2024h2-1', 'teamwork', 3, 'improving', NULL)
ON CONFLICT DO NOTHING;

-- Titan Squad Responses - 2025 H1
INSERT INTO health_check_responses (session_id, dimension_id, score, trend, comment) VALUES
('demo-session-titan-2025h1-1', 'mission', 3, 'stable', NULL),
('demo-session-titan-2025h1-1', 'value', 3, 'stable', NULL),
('demo-session-titan-2025h1-1', 'speed', 3, 'improving', NULL),
('demo-session-titan-2025h1-1', 'fun', 3, 'improving', NULL),
('demo-session-titan-2025h1-1', 'health', 2, 'stable', NULL),
('demo-session-titan-2025h1-1', 'learning', 3, 'stable', NULL),
('demo-session-titan-2025h1-1', 'support', 3, 'improving', NULL),
('demo-session-titan-2025h1-1', 'pawns', 3, 'improving', NULL),
('demo-session-titan-2025h1-1', 'release', 3, 'improving', NULL),
('demo-session-titan-2025h1-1', 'process', 3, 'stable', NULL),
('demo-session-titan-2025h1-1', 'teamwork', 3, 'stable', NULL)
ON CONFLICT DO NOTHING;

-- Falcon Squad Responses - 2024 H1 (New team, learning)
INSERT INTO health_check_responses (session_id, dimension_id, score, trend, comment) VALUES
('demo-session-falcon-2024h1-1', 'mission', 2, 'improving', 'Getting aligned'),
('demo-session-falcon-2024h1-1', 'value', 2, 'stable', NULL),
('demo-session-falcon-2024h1-1', 'speed', 2, 'improving', NULL),
('demo-session-falcon-2024h1-1', 'fun', 3, 'stable', 'Fresh energy'),
('demo-session-falcon-2024h1-1', 'health', 3, 'stable', 'Fresh codebase'),
('demo-session-falcon-2024h1-1', 'learning', 3, 'stable', 'Learning a lot'),
('demo-session-falcon-2024h1-1', 'support', 2, 'stable', NULL),
('demo-session-falcon-2024h1-1', 'pawns', 3, 'stable', NULL),
('demo-session-falcon-2024h1-1', 'release', 2, 'improving', NULL),
('demo-session-falcon-2024h1-1', 'process', 2, 'improving', 'Forming'),
('demo-session-falcon-2024h1-1', 'teamwork', 3, 'stable', NULL)
ON CONFLICT DO NOTHING;

-- Falcon Squad Responses - 2024 H2
INSERT INTO health_check_responses (session_id, dimension_id, score, trend, comment) VALUES
('demo-session-falcon-2024h2-1', 'mission', 3, 'improving', NULL),
('demo-session-falcon-2024h2-1', 'value', 3, 'improving', NULL),
('demo-session-falcon-2024h2-1', 'speed', 3, 'improving', NULL),
('demo-session-falcon-2024h2-1', 'fun', 3, 'stable', NULL),
('demo-session-falcon-2024h2-1', 'health', 3, 'stable', NULL),
('demo-session-falcon-2024h2-1', 'learning', 3, 'stable', NULL),
('demo-session-falcon-2024h2-1', 'support', 3, 'improving', NULL),
('demo-session-falcon-2024h2-1', 'pawns', 3, 'stable', NULL),
('demo-session-falcon-2024h2-1', 'release', 3, 'improving', NULL),
('demo-session-falcon-2024h2-1', 'process', 3, 'improving', NULL),
('demo-session-falcon-2024h2-1', 'teamwork', 3, 'stable', NULL)
ON CONFLICT DO NOTHING;

-- Falcon Squad Responses - 2025 H1
INSERT INTO health_check_responses (session_id, dimension_id, score, trend, comment) VALUES
('demo-session-falcon-2025h1-1', 'mission', 3, 'stable', NULL),
('demo-session-falcon-2025h1-1', 'value', 3, 'stable', NULL),
('demo-session-falcon-2025h1-1', 'speed', 3, 'stable', NULL),
('demo-session-falcon-2025h1-1', 'fun', 3, 'stable', NULL),
('demo-session-falcon-2025h1-1', 'health', 3, 'stable', NULL),
('demo-session-falcon-2025h1-1', 'learning', 3, 'stable', NULL),
('demo-session-falcon-2025h1-1', 'support', 3, 'stable', NULL),
('demo-session-falcon-2025h1-1', 'pawns', 3, 'stable', NULL),
('demo-session-falcon-2025h1-1', 'release', 3, 'stable', NULL),
('demo-session-falcon-2025h1-1', 'process', 3, 'stable', NULL),
('demo-session-falcon-2025h1-1', 'teamwork', 3, 'stable', NULL)
ON CONFLICT DO NOTHING;

-- Eagle Squad Responses - 2024 H1 (Mixed health)
INSERT INTO health_check_responses (session_id, dimension_id, score, trend, comment) VALUES
('demo-session-eagle-2024h1-1', 'mission', 3, 'stable', NULL),
('demo-session-eagle-2024h1-1', 'value', 2, 'stable', NULL),
('demo-session-eagle-2024h1-1', 'speed', 2, 'declining', 'Blockers'),
('demo-session-eagle-2024h1-1', 'fun', 2, 'stable', NULL),
('demo-session-eagle-2024h1-1', 'health', 2, 'declining', 'Growing debt'),
('demo-session-eagle-2024h1-1', 'learning', 3, 'stable', NULL),
('demo-session-eagle-2024h1-1', 'support', 2, 'stable', NULL),
('demo-session-eagle-2024h1-1', 'pawns', 2, 'declining', NULL),
('demo-session-eagle-2024h1-1', 'release', 1, 'declining', 'Painful'),
('demo-session-eagle-2024h1-1', 'process', 2, 'stable', NULL),
('demo-session-eagle-2024h1-1', 'teamwork', 3, 'stable', NULL)
ON CONFLICT DO NOTHING;

-- Eagle Squad Responses - 2024 H2 (Recovery)
INSERT INTO health_check_responses (session_id, dimension_id, score, trend, comment) VALUES
('demo-session-eagle-2024h2-1', 'mission', 3, 'stable', NULL),
('demo-session-eagle-2024h2-1', 'value', 3, 'improving', NULL),
('demo-session-eagle-2024h2-1', 'speed', 2, 'improving', NULL),
('demo-session-eagle-2024h2-1', 'fun', 2, 'stable', NULL),
('demo-session-eagle-2024h2-1', 'health', 2, 'improving', 'Focus on debt'),
('demo-session-eagle-2024h2-1', 'learning', 3, 'stable', NULL),
('demo-session-eagle-2024h2-1', 'support', 3, 'improving', NULL),
('demo-session-eagle-2024h2-1', 'pawns', 2, 'improving', NULL),
('demo-session-eagle-2024h2-1', 'release', 2, 'improving', NULL),
('demo-session-eagle-2024h2-1', 'process', 3, 'improving', NULL),
('demo-session-eagle-2024h2-1', 'teamwork', 3, 'stable', NULL)
ON CONFLICT DO NOTHING;

-- Eagle Squad Responses - 2025 H1 (Recovered)
INSERT INTO health_check_responses (session_id, dimension_id, score, trend, comment) VALUES
('demo-session-eagle-2025h1-1', 'mission', 3, 'stable', NULL),
('demo-session-eagle-2025h1-1', 'value', 3, 'stable', NULL),
('demo-session-eagle-2025h1-1', 'speed', 3, 'improving', NULL),
('demo-session-eagle-2025h1-1', 'fun', 3, 'improving', NULL),
('demo-session-eagle-2025h1-1', 'health', 3, 'improving', NULL),
('demo-session-eagle-2025h1-1', 'learning', 3, 'stable', NULL),
('demo-session-eagle-2025h1-1', 'support', 3, 'stable', NULL),
('demo-session-eagle-2025h1-1', 'pawns', 3, 'improving', NULL),
('demo-session-eagle-2025h1-1', 'release', 3, 'improving', NULL),
('demo-session-eagle-2025h1-1', 'process', 3, 'stable', NULL),
('demo-session-eagle-2025h1-1', 'teamwork', 3, 'stable', NULL)
ON CONFLICT DO NOTHING;
