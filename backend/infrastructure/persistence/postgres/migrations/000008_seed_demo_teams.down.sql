-- Remove demo team data
DELETE FROM team_supervisors WHERE team_id IN ('team-phoenix', 'team-dragon', 'team-titan', 'team-falcon', 'team-eagle');
DELETE FROM team_members WHERE team_id IN ('team-phoenix', 'team-dragon', 'team-titan', 'team-falcon', 'team-eagle');
DELETE FROM teams WHERE id IN ('team-phoenix', 'team-dragon', 'team-titan', 'team-falcon', 'team-eagle');
