-- Seed a dedicated test team "Nova Squad" with its own full hierarchy chain
-- All passwords are "demo" (bcrypt hash below)
-- Hierarchy: test-vp -> test-director -> test-manager -> test-lead -> test-member1, test-member2

-- Level 1: VP
INSERT INTO users (id, username, email, full_name, hierarchy_level_id, reports_to, password_hash)
VALUES ('test-vp', 'test-vp', 'test-vp@teams360.demo', 'VP - Rachel Kim', 'level-1', NULL,
        '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG')
ON CONFLICT (id) DO NOTHING;

-- Level 2: Director
INSERT INTO users (id, username, email, full_name, hierarchy_level_id, reports_to, password_hash)
VALUES ('test-director', 'test-director', 'test-director@teams360.demo', 'Director - James Park', 'level-2', 'test-vp',
        '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG')
ON CONFLICT (id) DO NOTHING;

-- Level 3: Manager
INSERT INTO users (id, username, email, full_name, hierarchy_level_id, reports_to, password_hash)
VALUES ('test-manager', 'test-manager', 'test-manager@teams360.demo', 'Manager - Priya Patel', 'level-3', 'test-director',
        '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG')
ON CONFLICT (id) DO NOTHING;

-- Level 4: Team Lead
INSERT INTO users (id, username, email, full_name, hierarchy_level_id, reports_to, password_hash)
VALUES ('test-lead', 'test-lead', 'test-lead@teams360.demo', 'Team Lead - Nova Squad', 'level-4', 'test-manager',
        '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG')
ON CONFLICT (id) DO NOTHING;

-- Level 5: Team Members
INSERT INTO users (id, username, email, full_name, hierarchy_level_id, reports_to, password_hash)
VALUES
    ('test-member1', 'test-member1', 'test-member1@teams360.demo', 'Nora Blake', 'level-5', 'test-lead',
     '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG'),
    ('test-member2', 'test-member2', 'test-member2@teams360.demo', 'Leo Chang', 'level-5', 'test-lead',
     '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG')
ON CONFLICT (id) DO NOTHING;

-- Create Nova Squad team
INSERT INTO teams (id, name, team_lead_id)
VALUES ('team-nova', 'Nova Squad', 'test-lead')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, team_lead_id = EXCLUDED.team_lead_id;

-- Assign team members (lead + 2 members)
INSERT INTO team_members (team_id, user_id) VALUES
    ('team-nova', 'test-lead'),
    ('team-nova', 'test-member1'),
    ('team-nova', 'test-member2')
ON CONFLICT (team_id, user_id) DO NOTHING;

-- Supervisor chain: test-lead -> test-manager -> test-director -> test-vp
INSERT INTO team_supervisors (team_id, user_id, hierarchy_level_id, position) VALUES
    ('team-nova', 'test-lead', 'level-4', 1),
    ('team-nova', 'test-manager', 'level-3', 2),
    ('team-nova', 'test-director', 'level-2', 3),
    ('team-nova', 'test-vp', 'level-1', 4)
ON CONFLICT (team_id, user_id) DO UPDATE SET position = EXCLUDED.position;
