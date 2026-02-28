-- Remove Nova Squad test team and its hierarchy
DELETE FROM team_supervisors WHERE team_id = 'team-nova';
DELETE FROM team_members WHERE team_id = 'team-nova';
DELETE FROM health_check_responses WHERE session_id IN (
    SELECT id FROM health_check_sessions WHERE team_id = 'team-nova'
);
DELETE FROM health_check_sessions WHERE team_id = 'team-nova';
DELETE FROM teams WHERE id = 'team-nova';
DELETE FROM users WHERE id IN ('test-vp', 'test-director', 'test-manager', 'test-lead', 'test-member1', 'test-member2');
