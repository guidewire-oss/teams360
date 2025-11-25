package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/agopalakrishnan/teams360/backend/domain/healthcheck"
	"github.com/agopalakrishnan/teams360/backend/interfaces/dto"
)

// TeamHandler handles team-related endpoints
type TeamHandler struct {
	repository healthcheck.Repository
}

// NewTeamHandler creates a new team handler
func NewTeamHandler(repo healthcheck.Repository) *TeamHandler {
	return &TeamHandler{
		repository: repo,
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

// SetupTeamRoutes registers team-related routes
func SetupTeamRoutes(router *gin.Engine, repo healthcheck.Repository) {
	handler := NewTeamHandler(repo)

	// Team routes
	router.GET("/api/v1/teams/:teamId", handler.GetTeamSessions)
}
