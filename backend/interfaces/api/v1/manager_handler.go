package v1

import (
	"net/http"

	"github.com/agopalakrishnan/teams360/backend/application/trends"
	"github.com/agopalakrishnan/teams360/backend/domain/healthcheck"
	"github.com/agopalakrishnan/teams360/backend/interfaces/dto"
	"github.com/gin-gonic/gin"
)

// ManagerHandler handles manager-related endpoints
type ManagerHandler struct {
	healthCheckRepo healthcheck.Repository
	trendsService   *trends.Service
}

// NewManagerHandler creates a new manager handler
func NewManagerHandler(healthCheckRepo healthcheck.Repository, trendsService *trends.Service) *ManagerHandler {
	return &ManagerHandler{
		healthCheckRepo: healthCheckRepo,
		trendsService:   trendsService,
	}
}

// GetManagerTeamsHealth handles GET /api/v1/managers/:managerId/teams/health
func (h *ManagerHandler) GetManagerTeamsHealth(c *gin.Context) {
	managerID := c.Param("managerId")

	// Validate input
	if managerID == "" {
		dto.RespondError(c, http.StatusBadRequest, "Manager ID is required")
		return
	}

	assessmentPeriod := c.Query("assessmentPeriod") // Optional filter

	// Use repository to fetch aggregated team health data
	teamSummaries, err := h.healthCheckRepo.FindTeamHealthByManager(c.Request.Context(), managerID, assessmentPeriod)
	if err != nil {
		dto.RespondErrorWithDetails(c, http.StatusInternalServerError, "Database query failed", err.Error())
		return
	}

	// Convert domain models to DTOs
	teams := make([]dto.TeamHealthSummary, len(teamSummaries))
	for i, summary := range teamSummaries {
		dimensions := make([]dto.DimensionSummary, len(summary.Dimensions))
		for j, dim := range summary.Dimensions {
			dimensions[j] = dto.DimensionSummary{
				DimensionID:   dim.DimensionID,
				AvgScore:      dim.AvgScore,
				ResponseCount: dim.ResponseCount,
			}
		}

		teams[i] = dto.TeamHealthSummary{
			TeamID:          summary.TeamID,
			TeamName:        summary.TeamName,
			SubmissionCount: summary.SubmissionCount,
			OverallHealth:   summary.OverallHealth,
			Dimensions:      dimensions,
		}
	}

	response := dto.ManagerTeamsHealthResponse{
		ManagerID:        managerID,
		Teams:            teams,
		TotalTeams:       len(teams),
		AssessmentPeriod: assessmentPeriod,
	}

	dto.RespondSuccess(c, http.StatusOK, response)
}

// GetManagerAggregatedRadar handles GET /api/v1/managers/:managerId/dashboard/radar
// Returns aggregated radar chart data across all supervised teams
func (h *ManagerHandler) GetManagerAggregatedRadar(c *gin.Context) {
	managerID := c.Param("managerId")

	if managerID == "" {
		dto.RespondError(c, http.StatusBadRequest, "Manager ID is required")
		return
	}

	assessmentPeriod := c.Query("assessmentPeriod")

	// Use repository to fetch aggregated dimension scores
	dimensionSummaries, err := h.healthCheckRepo.FindAggregatedDimensionsByManager(c.Request.Context(), managerID, assessmentPeriod)
	if err != nil {
		dto.RespondErrorWithDetails(c, http.StatusInternalServerError, "Database query failed", err.Error())
		return
	}

	// Convert domain models to DTOs
	dimensions := make([]dto.DimensionSummary, len(dimensionSummaries))
	for i, summary := range dimensionSummaries {
		dimensions[i] = dto.DimensionSummary{
			DimensionID:   summary.DimensionID,
			AvgScore:      summary.AvgScore,
			ResponseCount: summary.ResponseCount,
		}
	}

	response := dto.ManagerRadarResponse{
		ManagerID:        managerID,
		Dimensions:       dimensions,
		AssessmentPeriod: assessmentPeriod,
	}

	dto.RespondSuccess(c, http.StatusOK, response)
}

// GetManagerTrends handles GET /api/v1/managers/:managerId/dashboard/trends
// Returns trend data across assessment periods for all supervised teams
func (h *ManagerHandler) GetManagerTrends(c *gin.Context) {
	managerID := c.Param("managerId")

	if managerID == "" {
		dto.RespondError(c, http.StatusBadRequest, "Manager ID is required")
		return
	}

	result, err := h.trendsService.GetTrendsForManager(managerID)
	if err != nil {
		dto.RespondErrorWithDetails(c, http.StatusInternalServerError, "Failed to fetch trend data", err.Error())
		return
	}

	// Convert trend dimensions to DTO format
	dimensions := make([]dto.ManagerDimensionTrend, len(result.Dimensions))
	for i, dim := range result.Dimensions {
		dimensions[i] = dto.ManagerDimensionTrend{
			DimensionID: dim.DimensionID,
			Scores:      dim.Scores,
		}
	}

	response := dto.ManagerTrendsResponse{
		ManagerID:  managerID,
		Periods:    result.Periods,
		Dimensions: dimensions,
	}

	dto.RespondSuccess(c, http.StatusOK, response)
}
