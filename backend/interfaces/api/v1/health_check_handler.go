package v1

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel/attribute"

	"github.com/agopalakrishnan/teams360/backend/application/commands"
	"github.com/agopalakrishnan/teams360/backend/application/queries"
	"github.com/agopalakrishnan/teams360/backend/domain/healthcheck"
	"github.com/agopalakrishnan/teams360/backend/domain/organization"
	"github.com/agopalakrishnan/teams360/backend/interfaces/dto"
	"github.com/agopalakrishnan/teams360/backend/pkg/logger"
	"github.com/agopalakrishnan/teams360/backend/pkg/telemetry"
)

// HealthCheckHandler handles health check related endpoints
type HealthCheckHandler struct {
	submitHandler       *commands.SubmitHealthCheckHandler
	dimensionsHandler   *queries.GetHealthDimensionsHandler
	teamSessionsHandler *queries.GetTeamSessionsHandler
	repository          healthcheck.Repository
}

// NewHealthCheckHandler creates a new handler
func NewHealthCheckHandler(repository healthcheck.Repository, orgRepo organization.Repository) *HealthCheckHandler {
	return &HealthCheckHandler{
		submitHandler:       commands.NewSubmitHealthCheckHandler(repository),
		dimensionsHandler:   queries.NewGetHealthDimensionsHandler(orgRepo),
		teamSessionsHandler: queries.NewGetTeamSessionsHandler(repository),
		repository:          repository,
	}
}

// SubmitHealthCheck handles POST /api/v1/health-checks
func (h *HealthCheckHandler) SubmitHealthCheck(c *gin.Context) {
	ctx := c.Request.Context()
	startTime := time.Now()

	// Start business trace span
	ctx, span := telemetry.StartHealthCheckSpan(ctx, "submit")
	defer span.End()

	log := logger.Get().WithContext(ctx)

	var req dto.SubmitHealthCheckRequest

	// Bind and validate request
	if err := c.ShouldBindJSON(&req); err != nil {
		telemetry.SetSpanError(span, err)
		log.WithError(err).Warn("invalid health check submission request")
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	// Set span attributes for business context
	telemetry.SetHealthCheckAttributes(span, req.ID, req.TeamID, req.AssessmentPeriod, len(req.Responses))
	span.SetAttributes(
		attribute.String("user.id", req.UserID),
		attribute.Bool("survey.complete", req.Completed),
	)

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
		telemetry.SetSpanError(span, err)
		log.WithError(err).WithField("team_id", req.TeamID).Warn("failed to submit health check")
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Failed to submit health check",
			Message: err.Error(),
		})
		return
	}

	// Record successful submission metrics
	telemetry.RecordSurveySubmission(ctx, req.TeamID, req.AssessmentPeriod, len(req.Responses), time.Since(startTime))

	// Record individual dimension scores and comments for analytics
	commentsCount := 0
	for _, resp := range req.Responses {
		telemetry.RecordDimensionScore(ctx, resp.DimensionID, float64(resp.Score), resp.Trend)
		telemetry.RecordHealthByDimension(ctx, resp.DimensionID, float64(resp.Score))
		if resp.Comment != "" {
			telemetry.RecordSurveyWithComments(ctx, req.TeamID, resp.DimensionID)
			commentsCount++
		}
	}

	// Record comment rate for this survey
	if len(req.Responses) > 0 {
		commentRate := float64(commentsCount) / float64(len(req.Responses))
		telemetry.RecordSurveyCommentRate(ctx, req.TeamID, commentRate)
	}

	telemetry.SetSpanOK(span)
	log.WithFields(map[string]interface{}{
		"session_id":        session.ID,
		"team_id":           req.TeamID,
		"assessment_period": req.AssessmentPeriod,
		"dimension_count":   len(req.Responses),
	}).Info("health check submitted successfully")

	// Convert to response DTO
	response := convertSessionToDTO(session)

	c.JSON(http.StatusCreated, response)
}

// GetHealthDimensions handles GET /api/v1/health-dimensions
func (h *HealthCheckHandler) GetHealthDimensions(c *gin.Context) {
	ctx := c.Request.Context()

	// Start business trace span
	ctx, span := telemetry.StartHealthCheckSpan(ctx, "get_dimensions")
	defer span.End()

	log := logger.Get().WithContext(ctx)

	query := queries.GetHealthDimensionsQuery{
		OnlyActive: true, // Default to only active dimensions
	}

	dimensions, err := h.dimensionsHandler.Handle(query)
	if err != nil {
		telemetry.SetSpanError(span, err)
		log.WithError(err).Error("failed to fetch health dimensions")
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to fetch dimensions",
			Message: err.Error(),
		})
		return
	}

	span.SetAttributes(attribute.Int("dimensions.count", len(dimensions)))
	telemetry.SetSpanOK(span)

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
	ctx := c.Request.Context()

	// Start business trace span
	ctx, span := telemetry.StartHealthCheckSpan(ctx, "get_by_id")
	defer span.End()

	log := logger.Get().WithContext(ctx)
	id := c.Param("id")

	span.SetAttributes(attribute.String("healthcheck.id", id))

	session, err := h.repository.FindByID(ctx, id)
	if err != nil {
		telemetry.SetSpanError(span, err)
		log.WithField("session_id", id).Debug("health check session not found")
		c.JSON(http.StatusNotFound, dto.ErrorResponse{
			Error:   "Session not found",
			Message: err.Error(),
		})
		return
	}

	telemetry.SetSpanOK(span)
	response := convertSessionToDTO(session)
	c.JSON(http.StatusOK, response)
}

// GetTeamHealthChecks handles GET /api/v1/health-checks/team/:id
func (h *HealthCheckHandler) GetTeamHealthChecks(c *gin.Context) {
	ctx := c.Request.Context()
	startTime := time.Now()

	// Start business trace span
	ctx, span := telemetry.StartHealthCheckSpan(ctx, "get_team_sessions")
	defer span.End()

	log := logger.Get().WithContext(ctx)
	teamID := c.Param("id")
	assessmentPeriod := c.Query("assessmentPeriod")

	span.SetAttributes(
		attribute.String("team.id", teamID),
		attribute.String("healthcheck.assessment_period", assessmentPeriod),
	)

	query := queries.GetTeamSessionsQuery{
		TeamID:           teamID,
		AssessmentPeriod: assessmentPeriod,
	}

	sessions, err := h.teamSessionsHandler.Handle(query)
	if err != nil {
		telemetry.SetSpanError(span, err)
		log.WithError(err).WithField("team_id", teamID).Error("failed to fetch team health check sessions")
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to fetch sessions",
			Message: err.Error(),
		})
		return
	}

	// Record team health query metrics
	telemetry.RecordTeamHealthQuery(ctx, teamID, time.Since(startTime))

	span.SetAttributes(attribute.Int("sessions.count", len(sessions)))
	telemetry.SetSpanOK(span)

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
