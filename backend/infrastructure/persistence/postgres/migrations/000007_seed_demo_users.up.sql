-- Seed demo users for each hierarchy level
-- All passwords are hashed with bcrypt (password: "demo" for most users, "admin" for admin user)

-- Level 1: Vice President
INSERT INTO users (id, username, email, full_name, hierarchy_level_id, reports_to, password_hash)
VALUES
    ('vp1', 'vp', 'vp@teams360.demo', 'VP - Sarah Johnson', 'level-1', NULL, '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG')
ON CONFLICT (id) DO UPDATE SET password_hash = '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG';

-- Level 2: Directors (report to VP)
INSERT INTO users (id, username, email, full_name, hierarchy_level_id, reports_to, password_hash)
VALUES
    ('dir1', 'director1', 'director1@teams360.demo', 'Director - Mike Chen', 'level-2', 'vp1', '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG'),
    ('dir2', 'director2', 'director2@teams360.demo', 'Director - Lisa Anderson', 'level-2', 'vp1', '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG')
ON CONFLICT (id) DO UPDATE SET password_hash = '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG';

-- Level 3: Managers (report to Directors)
INSERT INTO users (id, username, email, full_name, hierarchy_level_id, reports_to, password_hash)
VALUES
    ('mgr1', 'manager1', 'manager1@teams360.demo', 'Manager - John Smith', 'level-3', 'dir1', '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG'),
    ('mgr2', 'manager2', 'manager2@teams360.demo', 'Manager - Emma Wilson', 'level-3', 'dir1', '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG'),
    ('mgr3', 'manager3', 'manager3@teams360.demo', 'Manager - David Brown', 'level-3', 'dir2', '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG')
ON CONFLICT (id) DO UPDATE SET password_hash = '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG';

-- Level 4: Team Leads (report to Managers)
INSERT INTO users (id, username, email, full_name, hierarchy_level_id, reports_to, password_hash)
VALUES
    ('lead1', 'teamlead1', 'teamlead1@teams360.demo', 'Team Lead - Phoenix Squad', 'level-4', 'mgr1', '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG'),
    ('lead2', 'teamlead2', 'teamlead2@teams360.demo', 'Team Lead - Dragon Squad', 'level-4', 'mgr1', '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG'),
    ('lead3', 'teamlead3', 'teamlead3@teams360.demo', 'Team Lead - Titan Squad', 'level-4', 'mgr2', '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG'),
    ('lead4', 'teamlead4', 'teamlead4@teams360.demo', 'Team Lead - Falcon Squad', 'level-4', 'mgr2', '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG'),
    ('lead5', 'teamlead5', 'teamlead5@teams360.demo', 'Team Lead - Eagle Squad', 'level-4', 'mgr3', '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG')
ON CONFLICT (id) DO UPDATE SET password_hash = '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG';

-- Level 5: Team Members (report to Team Leads)
INSERT INTO users (id, username, email, full_name, hierarchy_level_id, reports_to, password_hash)
VALUES
    ('member1', 'alice', 'alice@teams360.demo', 'Alice Cooper', 'level-5', 'lead1', '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG'),
    ('member2', 'bob', 'bob@teams360.demo', 'Bob Martinez', 'level-5', 'lead1', '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG'),
    ('member3', 'carol', 'carol@teams360.demo', 'Carol Davis', 'level-5', 'lead2', '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG'),
    ('member4', 'david', 'david@teams360.demo', 'David Lee', 'level-5', 'lead2', '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG'),
    ('member5', 'eve', 'eve@teams360.demo', 'Eve Taylor', 'level-5', 'lead3', '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG'),
    ('demo', 'demo', 'demo@teams360.demo', 'Demo User', 'level-5', 'lead1', '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG')
ON CONFLICT (id) DO UPDATE SET password_hash = '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG';

-- Administrator (special account, no hierarchy, password: "admin")
INSERT INTO users (id, username, email, full_name, hierarchy_level_id, reports_to, password_hash)
VALUES
    ('admin1', 'admin', 'admin@teams360.demo', 'Administrator', 'level-1', NULL, '$2a$10$OIc/j2lHs3sUYkWSEr8VW.HFva8imAr5l4tHIIx0bLwqKiCwdicve')
ON CONFLICT (id) DO UPDATE SET password_hash = '$2a$10$OIc/j2lHs3sUYkWSEr8VW.HFva8imAr5l4tHIIx0bLwqKiCwdicve';
