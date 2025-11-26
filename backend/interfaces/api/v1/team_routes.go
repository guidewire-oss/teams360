package v1

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/agopalakrishnan/teams360/backend/domain/healthcheck"
	"github.com/agopalakrishnan/teams360/backend/interfaces/dto"
)

// TeamHandler handles team-related endpoints
type TeamHandler struct {
	repository healthcheck.Repository
	db         *sql.DB
}

// NewTeamHandler creates a new team handler
func NewTeamHandler(repo healthcheck.Repository, db *sql.DB) *TeamHandler {
	return &TeamHandler{
		repository: repo,
		db:         db,
	}
}

// GetTeamSessions handles GET /api/v1/teams/:teamId
// Returns all health check sessions for a team with their responses
func (h *TeamHandler) GetTeamSessions(c *gin.Context) {
	teamID := c.Param("teamId")

	// Validate input
	if teamID == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Team ID is required",
			Message: "teamId parameter cannot be empty",
		})
		return
	}

	// Get optional assessment period filter
	assessmentPeriod := c.Query("assessmentPeriod")

	var sessions []*healthcheck.HealthCheckSession
	var err error

	// Fetch sessions based on filter - use repository query instead of in-memory filtering
	if assessmentPeriod != "" {
		// Filter by both team ID and assessment period via database query
		repo, ok := h.repository.(interface {
			FindByTeamAndPeriod(teamID, period string) ([]*healthcheck.HealthCheckSession, error)
		})
		if ok {
			sessions, err = repo.FindByTeamAndPeriod(teamID, assessmentPeriod)
		} else {
			// Fallback to in-memory filtering if repository doesn't support combined query
			allSessions, err := h.repository.FindByTeamID(teamID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
					Error:   "Failed to fetch team sessions",
					Message: err.Error(),
				})
				return
			}
			sessions = make([]*healthcheck.HealthCheckSession, 0)
			for _, session := range allSessions {
				if session.AssessmentPeriod == assessmentPeriod {
					sessions = append(sessions, session)
				}
			}
		}
	} else {
		// Fetch all sessions for team
		sessions, err = h.repository.FindByTeamID(teamID)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to fetch team sessions",
			Message: err.Error(),
		})
		return
	}

	// Convert to response DTO
	response := dto.HealthCheckSessionsResponse{
		Sessions: make([]dto.HealthCheckSessionResponse, len(sessions)),
		Total:    len(sessions),
	}

	for i, session := range sessions {
		response.Sessions[i] = convertSessionToDTO(session)
	}

	c.JSON(http.StatusOK, response)
}

// GetTeamInfo handles GET /api/v1/teams/:teamId/info
// Returns team details (id, name, cadence, members)
func (h *TeamHandler) GetTeamInfo(c *gin.Context) {
	teamID := c.Param("teamId")

	if teamID == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Team ID is required",
			Message: "teamId parameter cannot be empty",
		})
		return
	}

	// Query team info from database
	var team struct {
		ID       string
		Name     string
		Cadence  sql.NullString
		LeadID   sql.NullString
		LeadName sql.NullString
	}

	query := `
		SELECT t.id, t.name, t.cadence, t.team_lead_id, u.full_name as lead_name
		FROM teams t
		LEFT JOIN users u ON t.team_lead_id = u.id
		WHERE t.id = $1
	`
	err := h.db.QueryRow(query, teamID).Scan(
		&team.ID,
		&team.Name,
		&team.Cadence,
		&team.LeadID,
		&team.LeadName,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{
			Error:   "Team not found",
			Message: "No team found with the given ID",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Database error",
			Message: err.Error(),
		})
		return
	}

	// Get team members
	membersQuery := `
		SELECT u.id, u.username, u.full_name
		FROM team_members tm
		JOIN users u ON tm.user_id = u.id
		WHERE tm.team_id = $1
	`
	rows, err := h.db.Query(membersQuery, teamID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to fetch team members",
			Message: err.Error(),
		})
		return
	}
	defer rows.Close()

	members := []gin.H{}
	for rows.Next() {
		var member struct {
			ID       string
			Username string
			FullName string
		}
		if err := rows.Scan(&member.ID, &member.Username, &member.FullName); err == nil {
			members = append(members, gin.H{
				"id":       member.ID,
				"username": member.Username,
				"fullName": member.FullName,
			})
		}
	}

	cadence := "quarterly"
	if team.Cadence.Valid {
		cadence = team.Cadence.String
	}

	response := gin.H{
		"id":      team.ID,
		"name":    team.Name,
		"cadence": cadence,
		"members": members,
	}

	if team.LeadID.Valid {
		response["teamLeadId"] = team.LeadID.String
		if team.LeadName.Valid {
			response["teamLeadName"] = team.LeadName.String
		}
	}

	c.JSON(http.StatusOK, response)
}

// ListTeams handles GET /api/v1/teams
// Returns a list of all teams
func (h *TeamHandler) ListTeams(c *gin.Context) {
	query := `
		SELECT t.id, t.name, t.cadence, t.team_lead_id, u.full_name as lead_name,
		       (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id) as member_count
		FROM teams t
		LEFT JOIN users u ON t.team_lead_id = u.id
		ORDER BY t.name
	`
	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to fetch teams",
			Message: err.Error(),
		})
		return
	}
	defer rows.Close()

	teams := []gin.H{}
	for rows.Next() {
		var team struct {
			ID          string
			Name        string
			Cadence     sql.NullString
			LeadID      sql.NullString
			LeadName    sql.NullString
			MemberCount int
		}
		if err := rows.Scan(&team.ID, &team.Name, &team.Cadence, &team.LeadID, &team.LeadName, &team.MemberCount); err != nil {
			continue
		}

		cadence := "quarterly"
		if team.Cadence.Valid {
			cadence = team.Cadence.String
		}

		teamData := gin.H{
			"id":          team.ID,
			"name":        team.Name,
			"cadence":     cadence,
			"memberCount": team.MemberCount,
		}

		if team.LeadID.Valid {
			teamData["teamLeadId"] = team.LeadID.String
			if team.LeadName.Valid {
				teamData["teamLeadName"] = team.LeadName.String
			}
		}

		teams = append(teams, teamData)
	}

	c.JSON(http.StatusOK, gin.H{
		"teams": teams,
		"total": len(teams),
	})
}

// SetupTeamRoutes registers team-related routes
func SetupTeamRoutes(router *gin.Engine, repo healthcheck.Repository, db *sql.DB) {
	handler := NewTeamHandler(repo, db)

	// Team routes
	router.GET("/api/v1/teams", handler.ListTeams)
	router.GET("/api/v1/teams/:teamId/sessions", handler.GetTeamSessions)
	router.GET("/api/v1/teams/:teamId/info", handler.GetTeamInfo)
}
