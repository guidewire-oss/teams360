package postgres

import (
	"database/sql"
	"fmt"

	"github.com/agopalakrishnan/teams360/backend/domain/healthcheck"
)

// HealthCheckRepository implements the healthcheck.Repository interface
type HealthCheckRepository struct {
	db *sql.DB
}

// NewHealthCheckRepository creates a new repository instance
func NewHealthCheckRepository(db *sql.DB) healthcheck.Repository {
	return &HealthCheckRepository{db: db}
}

// Save persists a health check session and its responses (atomic operation)
func (r *HealthCheckRepository) Save(session *healthcheck.HealthCheckSession) error {
	// Begin transaction for atomic save
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Insert or update session
	_, err = tx.Exec(`
		INSERT INTO health_check_sessions (
			id, team_id, user_id, date, assessment_period, completed, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
		ON CONFLICT (id) DO UPDATE SET
			team_id = EXCLUDED.team_id,
			user_id = EXCLUDED.user_id,
			date = EXCLUDED.date,
			assessment_period = EXCLUDED.assessment_period,
			completed = EXCLUDED.completed,
			updated_at = CURRENT_TIMESTAMP
	`, session.ID, session.TeamID, session.UserID, session.Date, session.AssessmentPeriod, session.Completed)

	if err != nil {
		return fmt.Errorf("failed to save session: %w", err)
	}

	// Delete existing responses (for updates)
	_, err = tx.Exec("DELETE FROM health_check_responses WHERE session_id = $1", session.ID)
	if err != nil {
		return fmt.Errorf("failed to delete existing responses: %w", err)
	}

	// Insert responses
	for _, response := range session.Responses {
		_, err = tx.Exec(`
			INSERT INTO health_check_responses (
				session_id, dimension_id, score, trend, comment
			) VALUES ($1, $2, $3, $4, $5)
		`, session.ID, response.DimensionID, response.Score, response.Trend, response.Comment)

		if err != nil {
			return fmt.Errorf("failed to save response: %w", err)
		}
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// FindByID retrieves a session by ID
func (r *HealthCheckRepository) FindByID(id string) (*healthcheck.HealthCheckSession, error) {
	sessions, err := r.scanSessions(`
		SELECT s.id, s.team_id, s.user_id, s.date, s.assessment_period, s.completed,
		       r.dimension_id, r.score, r.trend, r.comment
		FROM health_check_sessions s
		LEFT JOIN health_check_responses r ON s.id = r.session_id
		WHERE s.id = $1
		ORDER BY r.dimension_id
	`, id)

	if err != nil {
		return nil, err
	}

	if len(sessions) == 0 {
		return nil, fmt.Errorf("session not found: %s", id)
	}

	return sessions[0], nil
}

// FindByTeamID retrieves all sessions for a team
func (r *HealthCheckRepository) FindByTeamID(teamID string) ([]*healthcheck.HealthCheckSession, error) {
	return r.scanSessions(`
		SELECT s.id, s.team_id, s.user_id, s.date, s.assessment_period, s.completed,
		       r.dimension_id, r.score, r.trend, r.comment
		FROM health_check_sessions s
		LEFT JOIN health_check_responses r ON s.id = r.session_id
		WHERE s.team_id = $1
		ORDER BY s.date DESC, r.dimension_id
	`, teamID)
}

// FindByUserID retrieves all sessions for a user
func (r *HealthCheckRepository) FindByUserID(userID string) ([]*healthcheck.HealthCheckSession, error) {
	return r.scanSessions(`
		SELECT s.id, s.team_id, s.user_id, s.date, s.assessment_period, s.completed,
		       r.dimension_id, r.score, r.trend, r.comment
		FROM health_check_sessions s
		LEFT JOIN health_check_responses r ON s.id = r.session_id
		WHERE s.user_id = $1
		ORDER BY s.date DESC, r.dimension_id
	`, userID)
}

// FindByAssessmentPeriod retrieves all sessions for an assessment period
func (r *HealthCheckRepository) FindByAssessmentPeriod(period string) ([]*healthcheck.HealthCheckSession, error) {
	return r.scanSessions(`
		SELECT s.id, s.team_id, s.user_id, s.date, s.assessment_period, s.completed,
		       r.dimension_id, r.score, r.trend, r.comment
		FROM health_check_sessions s
		LEFT JOIN health_check_responses r ON s.id = r.session_id
		WHERE s.assessment_period = $1
		ORDER BY s.date DESC, r.dimension_id
	`, period)
}

// Delete removes a session and its responses (cascade handled by DB)
func (r *HealthCheckRepository) Delete(id string) error {
	result, err := r.db.Exec("DELETE FROM health_check_sessions WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("failed to delete session: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("session not found: %s", id)
	}

	return nil
}

// scanSessions is a helper function to scan query results into sessions
func (r *HealthCheckRepository) scanSessions(query string, args ...interface{}) ([]*healthcheck.HealthCheckSession, error) {
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("query failed: %w", err)
	}
	defer rows.Close()

	sessionsMap := make(map[string]*healthcheck.HealthCheckSession)
	sessionOrder := []string{}

	for rows.Next() {
		var (
			sessionID        string
			teamID           string
			userID           string
			date             string
			assessmentPeriod sql.NullString
			completed        bool
			dimensionID      sql.NullString
			score            sql.NullInt64
			trend            sql.NullString
			comment          sql.NullString
		)

		err := rows.Scan(
			&sessionID, &teamID, &userID, &date, &assessmentPeriod, &completed,
			&dimensionID, &score, &trend, &comment,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}

		// Create or get session
		session, exists := sessionsMap[sessionID]
		if !exists {
			session = &healthcheck.HealthCheckSession{
				ID:               sessionID,
				TeamID:           teamID,
				UserID:           userID,
				Date:             date,
				AssessmentPeriod: assessmentPeriod.String,
				Completed:        completed,
				Responses:        []healthcheck.HealthCheckResponse{},
			}
			sessionsMap[sessionID] = session
			sessionOrder = append(sessionOrder, sessionID)
		}

		// Add response if exists
		if dimensionID.Valid {
			session.Responses = append(session.Responses, healthcheck.HealthCheckResponse{
				DimensionID: dimensionID.String,
				Score:       int(score.Int64),
				Trend:       trend.String,
				Comment:     comment.String,
			})
		}
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}

	// Convert map to ordered slice
	sessions := make([]*healthcheck.HealthCheckSession, 0, len(sessionOrder))
	for _, id := range sessionOrder {
		sessions = append(sessions, sessionsMap[id])
	}

	return sessions, nil
}
