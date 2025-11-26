package v1

import (
	"github.com/agopalakrishnan/teams360/backend/application/trends"
	"github.com/agopalakrishnan/teams360/backend/domain/healthcheck"
	"github.com/gin-gonic/gin"
)

// SetupManagerRoutes registers manager-related routes with repository dependency injection
func SetupManagerRoutes(router *gin.Engine, healthCheckRepo healthcheck.Repository, trendsService *trends.Service) {
	handler := NewManagerHandler(healthCheckRepo, trendsService)

	// Manager dashboard routes
	managers := router.Group("/api/v1/managers")
	{
		managers.GET("/:managerId/teams/health", handler.GetManagerTeamsHealth)
		managers.GET("/:managerId/dashboard/radar", handler.GetManagerAggregatedRadar)
		managers.GET("/:managerId/dashboard/trends", handler.GetManagerTrends)
	}
}
