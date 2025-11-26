-- Seed demo users for each hierarchy level
-- All passwords are hashed with bcrypt (password: "demo" for most users, "admin" for admin user)
-- User IDs match usernames for simplicity

-- Level 1: Vice President
INSERT INTO users (id, username, email, full_name, hierarchy_level_id, reports_to, password_hash)
VALUES
    ('vp', 'vp', 'vp@teams360.demo', 'VP - Sarah Johnson', 'level-1', NULL, '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG')
ON CONFLICT (id) DO UPDATE SET password_hash = '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG';

-- Level 2: Directors (report to VP)
INSERT INTO users (id, username, email, full_name, hierarchy_level_id, reports_to, password_hash)
VALUES
    ('director1', 'director1', 'director1@teams360.demo', 'Director - Mike Chen', 'level-2', 'vp', '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG'),
    ('director2', 'director2', 'director2@teams360.demo', 'Director - Lisa Anderson', 'level-2', 'vp', '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG')
ON CONFLICT (id) DO UPDATE SET password_hash = '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG';

-- Level 3: Managers (report to Directors)
INSERT INTO users (id, username, email, full_name, hierarchy_level_id, reports_to, password_hash)
VALUES
    ('manager1', 'manager1', 'manager1@teams360.demo', 'Manager - John Smith', 'level-3', 'director1', '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG'),
    ('manager2', 'manager2', 'manager2@teams360.demo', 'Manager - Emma Wilson', 'level-3', 'director1', '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG'),
    ('manager3', 'manager3', 'manager3@teams360.demo', 'Manager - David Brown', 'level-3', 'director2', '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG')
ON CONFLICT (id) DO UPDATE SET password_hash = '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG';

-- Level 4: Team Leads (report to Managers)
INSERT INTO users (id, username, email, full_name, hierarchy_level_id, reports_to, password_hash)
VALUES
    ('teamlead1', 'teamlead1', 'teamlead1@teams360.demo', 'Team Lead - Phoenix Squad', 'level-4', 'manager1', '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG'),
    ('teamlead2', 'teamlead2', 'teamlead2@teams360.demo', 'Team Lead - Dragon Squad', 'level-4', 'manager1', '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG'),
    ('teamlead3', 'teamlead3', 'teamlead3@teams360.demo', 'Team Lead - Titan Squad', 'level-4', 'manager2', '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG'),
    ('teamlead4', 'teamlead4', 'teamlead4@teams360.demo', 'Team Lead - Falcon Squad', 'level-4', 'manager2', '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG'),
    ('teamlead5', 'teamlead5', 'teamlead5@teams360.demo', 'Team Lead - Eagle Squad', 'level-4', 'manager3', '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG')
ON CONFLICT (id) DO UPDATE SET password_hash = '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG';

-- Level 5: Team Members (report to Team Leads)
INSERT INTO users (id, username, email, full_name, hierarchy_level_id, reports_to, password_hash)
VALUES
    ('alice', 'alice', 'alice@teams360.demo', 'Alice Cooper', 'level-5', 'teamlead1', '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG'),
    ('bob', 'bob', 'bob@teams360.demo', 'Bob Martinez', 'level-5', 'teamlead1', '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG'),
    ('carol', 'carol', 'carol@teams360.demo', 'Carol Davis', 'level-5', 'teamlead2', '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG'),
    ('david', 'david', 'david@teams360.demo', 'David Lee', 'level-5', 'teamlead2', '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG'),
    ('eve', 'eve', 'eve@teams360.demo', 'Eve Taylor', 'level-5', 'teamlead3', '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG'),
    ('demo', 'demo', 'demo@teams360.demo', 'Demo User', 'level-5', 'teamlead1', '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG')
ON CONFLICT (id) DO UPDATE SET password_hash = '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG';

-- Administrator (special account, no hierarchy, password: "admin")
INSERT INTO users (id, username, email, full_name, hierarchy_level_id, reports_to, password_hash)
VALUES
    ('admin', 'admin', 'admin@teams360.demo', 'Administrator', 'level-1', NULL, '$2a$10$OIc/j2lHs3sUYkWSEr8VW.HFva8imAr5l4tHIIx0bLwqKiCwdicve')
ON CONFLICT (id) DO UPDATE SET password_hash = '$2a$10$OIc/j2lHs3sUYkWSEr8VW.HFva8imAr5l4tHIIx0bLwqKiCwdicve';
