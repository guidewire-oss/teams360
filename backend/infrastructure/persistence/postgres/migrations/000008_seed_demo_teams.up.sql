-- Seed demo teams (squads led by team leads)
-- Each team lead manages one squad
-- User IDs now match usernames (vp, director1, manager1, teamlead1, etc.)

-- Create teams for each team lead
INSERT INTO teams (id, name, team_lead_id) VALUES
    ('team-phoenix', 'Phoenix Squad', 'teamlead1'),
    ('team-dragon', 'Dragon Squad', 'teamlead2'),
    ('team-titan', 'Titan Squad', 'teamlead3'),
    ('team-falcon', 'Falcon Squad', 'teamlead4'),
    ('team-eagle', 'Eagle Squad', 'teamlead5')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, team_lead_id = EXCLUDED.team_lead_id;

-- Assign team members to teams
-- Phoenix Squad (teamlead1's team - under manager1)
INSERT INTO team_members (team_id, user_id) VALUES
    ('team-phoenix', 'teamlead1'),
    ('team-phoenix', 'alice'),
    ('team-phoenix', 'bob'),
    ('team-phoenix', 'demo')
ON CONFLICT (team_id, user_id) DO NOTHING;

-- Dragon Squad (teamlead2's team - under manager1)
INSERT INTO team_members (team_id, user_id) VALUES
    ('team-dragon', 'teamlead2'),
    ('team-dragon', 'carol'),
    ('team-dragon', 'david')
ON CONFLICT (team_id, user_id) DO NOTHING;

-- Titan Squad (teamlead3's team - under manager2)
INSERT INTO team_members (team_id, user_id) VALUES
    ('team-titan', 'teamlead3'),
    ('team-titan', 'eve')
ON CONFLICT (team_id, user_id) DO NOTHING;

-- Falcon Squad (teamlead4's team - under manager2)
INSERT INTO team_members (team_id, user_id) VALUES
    ('team-falcon', 'teamlead4')
ON CONFLICT (team_id, user_id) DO NOTHING;

-- Eagle Squad (teamlead5's team - under manager3)
INSERT INTO team_members (team_id, user_id) VALUES
    ('team-eagle', 'teamlead5')
ON CONFLICT (team_id, user_id) DO NOTHING;

-- Set up supervisor chains for each team
-- Phoenix Squad: teamlead1 -> manager1 -> director1 -> vp
INSERT INTO team_supervisors (team_id, user_id, hierarchy_level_id, position) VALUES
    ('team-phoenix', 'teamlead1', 'level-4', 1),
    ('team-phoenix', 'manager1', 'level-3', 2),
    ('team-phoenix', 'director1', 'level-2', 3),
    ('team-phoenix', 'vp', 'level-1', 4)
ON CONFLICT (team_id, user_id) DO UPDATE SET position = EXCLUDED.position;

-- Dragon Squad: teamlead2 -> manager1 -> director1 -> vp
INSERT INTO team_supervisors (team_id, user_id, hierarchy_level_id, position) VALUES
    ('team-dragon', 'teamlead2', 'level-4', 1),
    ('team-dragon', 'manager1', 'level-3', 2),
    ('team-dragon', 'director1', 'level-2', 3),
    ('team-dragon', 'vp', 'level-1', 4)
ON CONFLICT (team_id, user_id) DO UPDATE SET position = EXCLUDED.position;

-- Titan Squad: teamlead3 -> manager2 -> director1 -> vp
INSERT INTO team_supervisors (team_id, user_id, hierarchy_level_id, position) VALUES
    ('team-titan', 'teamlead3', 'level-4', 1),
    ('team-titan', 'manager2', 'level-3', 2),
    ('team-titan', 'director1', 'level-2', 3),
    ('team-titan', 'vp', 'level-1', 4)
ON CONFLICT (team_id, user_id) DO UPDATE SET position = EXCLUDED.position;

-- Falcon Squad: teamlead4 -> manager2 -> director1 -> vp
INSERT INTO team_supervisors (team_id, user_id, hierarchy_level_id, position) VALUES
    ('team-falcon', 'teamlead4', 'level-4', 1),
    ('team-falcon', 'manager2', 'level-3', 2),
    ('team-falcon', 'director1', 'level-2', 3),
    ('team-falcon', 'vp', 'level-1', 4)
ON CONFLICT (team_id, user_id) DO UPDATE SET position = EXCLUDED.position;

-- Eagle Squad: teamlead5 -> manager3 -> director2 -> vp
INSERT INTO team_supervisors (team_id, user_id, hierarchy_level_id, position) VALUES
    ('team-eagle', 'teamlead5', 'level-4', 1),
    ('team-eagle', 'manager3', 'level-3', 2),
    ('team-eagle', 'director2', 'level-2', 3),
    ('team-eagle', 'vp', 'level-1', 4)
ON CONFLICT (team_id, user_id) DO UPDATE SET position = EXCLUDED.position;
