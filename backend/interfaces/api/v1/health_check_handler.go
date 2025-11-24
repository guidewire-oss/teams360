package v1

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/agopalakrishnan/teams360/backend/application/commands"
	"github.com/agopalakrishnan/teams360/backend/application/queries"
	"github.com/agopalakrishnan/teams360/backend/domain/healthcheck"
	"github.com/agopalakrishnan/teams360/backend/interfaces/dto"
)

// HealthCheckHandler handles health check related endpoints
type HealthCheckHandler struct {
	submitHandler          *commands.SubmitHealthCheckHandler
	dimensionsHandler      *queries.GetHealthDimensionsHandler
	teamSessionsHandler    *queries.GetTeamSessionsHandler
	repository             healthcheck.Repository
}

// NewHealthCheckHandler creates a new handler
func NewHealthCheckHandler(db *sql.DB, repository healthcheck.Repository) *HealthCheckHandler {
	return &HealthCheckHandler{
		submitHandler:       commands.NewSubmitHealthCheckHandler(repository),
		dimensionsHandler:   queries.NewGetHealthDimensionsHandler(db),
		teamSessionsHandler: queries.NewGetTeamSessionsHandler(repository),
		repository:          repository,
	}
}

// SubmitHealthCheck handles POST /api/v1/health-checks
func (h *HealthCheckHandler) SubmitHealthCheck(c *gin.Context) {
	var req dto.SubmitHealthCheckRequest

	// Bind and validate request
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	// Convert DTO to command
	cmd := commands.SubmitHealthCheckCommand{
		ID:               req.ID,
		TeamID:           req.TeamID,
		UserID:           req.UserID,
		Date:             req.Date,
		AssessmentPeriod: req.AssessmentPeriod,
		Responses:        make([]commands.HealthCheckResponseCommand, len(req.Responses)),
		Completed:        req.Completed,
	}

	for i, resp := range req.Responses {
		cmd.Responses[i] = commands.HealthCheckResponseCommand{
			DimensionID: resp.DimensionID,
			Score:       resp.Score,
			Trend:       resp.Trend,
			Comment:     resp.Comment,
		}
	}

	// Execute command
	session, err := h.submitHandler.Handle(cmd)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Failed to submit health check",
			Message: err.Error(),
		})
		return
	}

	// Convert to response DTO
	response := convertSessionToDTO(session)

	c.JSON(http.StatusCreated, response)
}

// GetHealthDimensions handles GET /api/v1/health-dimensions
func (h *HealthCheckHandler) GetHealthDimensions(c *gin.Context) {
	query := queries.GetHealthDimensionsQuery{
		OnlyActive: true, // Default to only active dimensions
	}

	dimensions, err := h.dimensionsHandler.Handle(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to fetch dimensions",
			Message: err.Error(),
		})
		return
	}

	// Convert to response DTO
	response := dto.HealthDimensionsResponse{
		Dimensions: make([]dto.HealthDimensionResponse, len(dimensions)),
	}

	for i, dim := range dimensions {
		response.Dimensions[i] = dto.HealthDimensionResponse{
			ID:              dim.ID,
			Name:            dim.Name,
			Description:     dim.Description,
			GoodDescription: dim.GoodDescription,
			BadDescription:  dim.BadDescription,
			IsActive:        dim.IsActive,
			Weight:          dim.Weight,
		}
	}

	c.JSON(http.StatusOK, response)
}

// GetHealthCheckByID handles GET /api/v1/health-checks/:id
func (h *HealthCheckHandler) GetHealthCheckByID(c *gin.Context) {
	id := c.Param("id")

	session, err := h.repository.FindByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{
			Error:   "Session not found",
			Message: err.Error(),
		})
		return
	}

	response := convertSessionToDTO(session)
	c.JSON(http.StatusOK, response)
}

// GetTeamHealthChecks handles GET /api/v1/health-checks/team/:id
func (h *HealthCheckHandler) GetTeamHealthChecks(c *gin.Context) {
	teamID := c.Param("id")
	assessmentPeriod := c.Query("assessmentPeriod")

	query := queries.GetTeamSessionsQuery{
		TeamID:           teamID,
		AssessmentPeriod: assessmentPeriod,
	}

	sessions, err := h.teamSessionsHandler.Handle(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to fetch sessions",
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

// Helper function to convert domain model to DTO
func convertSessionToDTO(session *healthcheck.HealthCheckSession) dto.HealthCheckSessionResponse {
	response := dto.HealthCheckSessionResponse{
		ID:               session.ID,
		TeamID:           session.TeamID,
		UserID:           session.UserID,
		Date:             session.Date,
		AssessmentPeriod: session.AssessmentPeriod,
		Responses:        make([]dto.HealthCheckResponseResponse, len(session.Responses)),
		Completed:        session.Completed,
	}

	for i, resp := range session.Responses {
		response.Responses[i] = dto.HealthCheckResponseResponse{
			DimensionID: resp.DimensionID,
			Score:       resp.Score,
			Trend:       resp.Trend,
			Comment:     resp.Comment,
		}
	}

	return response
}
