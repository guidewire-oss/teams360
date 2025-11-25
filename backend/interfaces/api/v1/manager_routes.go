package v1

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/agopalakrishnan/teams360/backend/interfaces/dto"
	"github.com/gin-gonic/gin"
)

// ManagerHandler handles manager-related endpoints
type ManagerHandler struct {
	db *sql.DB
}

// NewManagerHandler creates a new manager handler
func NewManagerHandler(db *sql.DB) *ManagerHandler {
	return &ManagerHandler{
		db: db,
	}
}

// GetManagerTeamsHealth handles GET /api/v1/managers/:managerId/teams/health
func (h *ManagerHandler) GetManagerTeamsHealth(c *gin.Context) {
	managerID := c.Param("managerId")

	// Validate input
	if managerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Manager ID is required"})
		return
	}

	assessmentPeriod := c.Query("assessmentPeriod") // Optional filter

	// Single optimized query to get all team data with dimensions
	// Avoids N+1 query problem by using CTEs
	query := `
		WITH team_health AS (
			SELECT DISTINCT
				t.id as team_id,
				t.name as team_name,
				COUNT(DISTINCT hcs.id) as submission_count,
				AVG(hcr.score) as overall_health
			FROM teams t
			INNER JOIN team_supervisors ts ON t.id = ts.team_id
			LEFT JOIN health_check_sessions hcs ON t.id = hcs.team_id
				AND hcs.completed = true
				AND ($2 = '' OR hcs.assessment_period = $2)
			LEFT JOIN health_check_responses hcr ON hcs.id = hcr.session_id
			WHERE ts.user_id = $1
			GROUP BY t.id, t.name
		),
		dimension_health AS (
			SELECT
				hcs.team_id,
				hcr.dimension_id,
				AVG(hcr.score) as avg_score,
				COUNT(hcr.id) as response_count
			FROM health_check_responses hcr
			INNER JOIN health_check_sessions hcs ON hcr.session_id = hcs.id
			WHERE hcs.completed = true
				AND ($2 = '' OR hcs.assessment_period = $2)
				AND hcs.team_id IN (SELECT team_id FROM team_health)
			GROUP BY hcs.team_id, hcr.dimension_id
		)
		SELECT
			th.team_id,
			th.team_name,
			th.submission_count,
			COALESCE(th.overall_health, 0) as overall_health,
			COALESCE(
				json_agg(
					json_build_object(
						'dimensionId', dh.dimension_id,
						'avgScore', dh.avg_score,
						'responseCount', dh.response_count
					) ORDER BY dh.dimension_id
				) FILTER (WHERE dh.dimension_id IS NOT NULL),
				'[]'::json
			) as dimensions
		FROM team_health th
		LEFT JOIN dimension_health dh ON th.team_id = dh.team_id
		GROUP BY th.team_id, th.team_name, th.submission_count, th.overall_health
		ORDER BY overall_health ASC NULLS LAST
	`

	rows, err := h.db.Query(query, managerID, assessmentPeriod)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Database query failed",
			"details": err.Error(),
		})
		return
	}
	defer rows.Close()

	teams := []dto.TeamHealthSummary{}
	for rows.Next() {
		var team dto.TeamHealthSummary
		var dimensionsJSON []byte

		err := rows.Scan(
			&team.TeamID,
			&team.TeamName,
			&team.SubmissionCount,
			&team.OverallHealth,
			&dimensionsJSON,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to parse team data",
				"details": err.Error(),
			})
			return
		}

		// Parse dimensions JSON
		if len(dimensionsJSON) > 0 && string(dimensionsJSON) != "[]" {
			err = json.Unmarshal(dimensionsJSON, &team.Dimensions)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": "Failed to parse dimension data",
					"details": err.Error(),
				})
				return
			}
		} else {
			team.Dimensions = []dto.DimensionSummary{}
		}

		teams = append(teams, team)
	}

	response := gin.H{
		"managerId":  managerID,
		"teams":      teams,
		"totalTeams": len(teams),
	}

	if assessmentPeriod != "" {
		response["assessmentPeriod"] = assessmentPeriod
	}

	c.JSON(http.StatusOK, response)
}

// SetupManagerRoutes registers manager-related routes
func SetupManagerRoutes(router *gin.Engine, db *sql.DB) {
	handler := NewManagerHandler(db)

	router.GET("/api/v1/managers/:managerId/teams/health", handler.GetManagerTeamsHealth)
}
