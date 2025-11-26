package v1

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/agopalakrishnan/teams360/backend/interfaces/dto"
	"github.com/gin-gonic/gin"
)

// UserHandler handles user-related endpoints
type UserHandler struct {
	db *sql.DB
}

// NewUserHandler creates a new user handler
func NewUserHandler(db *sql.DB) *UserHandler {
	return &UserHandler{
		db: db,
	}
}

// GetUserSurveyHistory handles GET /api/v1/users/:userId/survey-history
func (h *UserHandler) GetUserSurveyHistory(c *gin.Context) {
	userID := c.Param("userId")

	// Validate input
	if userID == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "User ID is required"})
		return
	}

	// Get optional query parameters
	assessmentPeriod := c.Query("assessmentPeriod")
	limitStr := c.Query("limit")

	// Default limit to 10 if not specified
	limit := 10
	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	// Build query to get user's survey history
	query := `
		SELECT
			hcs.id as session_id,
			hcs.team_id,
			t.name as team_name,
			hcs.date,
			COALESCE(hcs.assessment_period, '') as assessment_period,
			hcs.completed,
			COALESCE(AVG(hcr.score), 0) as avg_score,
			COUNT(hcr.id) as response_count
		FROM health_check_sessions hcs
		JOIN teams t ON hcs.team_id = t.id
		LEFT JOIN health_check_responses hcr ON hcs.id = hcr.session_id
		WHERE hcs.user_id = $1
			AND ($2 = '' OR hcs.assessment_period = $2)
		GROUP BY hcs.id, hcs.team_id, t.name, hcs.date, hcs.assessment_period, hcs.completed
		ORDER BY hcs.date DESC
		LIMIT $3
	`

	rows, err := h.db.Query(query, userID, assessmentPeriod, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Database query failed",
			Message: err.Error(),
		})
		return
	}
	defer rows.Close()

	surveyHistory := []dto.SurveyHistoryEntry{}
	for rows.Next() {
		var entry dto.SurveyHistoryEntry

		err := rows.Scan(
			&entry.SessionID,
			&entry.TeamID,
			&entry.TeamName,
			&entry.Date,
			&entry.AssessmentPeriod,
			&entry.Completed,
			&entry.AvgScore,
			&entry.ResponseCount,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
				Error:   "Failed to parse survey history data",
				Message: err.Error(),
			})
			return
		}

		surveyHistory = append(surveyHistory, entry)
	}

	// Get total count of sessions (without limit)
	countQuery := `
		SELECT COUNT(DISTINCT hcs.id)
		FROM health_check_sessions hcs
		WHERE hcs.user_id = $1
			AND ($2 = '' OR hcs.assessment_period = $2)
	`

	var totalSessions int
	err = h.db.QueryRow(countQuery, userID, assessmentPeriod).Scan(&totalSessions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get total session count",
			Message: err.Error(),
		})
		return
	}

	response := dto.SurveyHistoryResponse{
		UserID:        userID,
		SurveyHistory: surveyHistory,
		TotalSessions: totalSessions,
	}

	c.JSON(http.StatusOK, response)
}
