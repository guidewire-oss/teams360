-- Remove demo health check responses and sessions
DELETE FROM health_check_responses WHERE session_id LIKE 'demo-session-%';
DELETE FROM health_check_sessions WHERE id LIKE 'demo-session-%';
