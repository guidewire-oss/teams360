package v1

import (
	"github.com/gin-gonic/gin"

	"github.com/agopalakrishnan/teams360/backend/domain/healthcheck"
	"github.com/agopalakrishnan/teams360/backend/domain/organization"
)

// SetupHealthCheckRoutes registers health check routes with repository injection
func SetupHealthCheckRoutes(router *gin.Engine, healthCheckRepo healthcheck.Repository, orgRepo organization.Repository) {
	handler := NewHealthCheckHandler(healthCheckRepo, orgRepo)

	// Health check routes
	router.POST("/api/v1/health-checks", handler.SubmitHealthCheck)
	router.GET("/api/v1/health-dimensions", handler.GetHealthDimensions)
	router.GET("/api/v1/health-checks/:id", handler.GetHealthCheckByID)
	// Using /health-checks/team/:id to avoid conflict with /teams/:id
	router.GET("/api/v1/health-checks/team/:id", handler.GetTeamHealthChecks)
}
