package v1

import (
	"database/sql"

	"github.com/gin-gonic/gin"
)

// SetupManagerRoutes registers manager-related routes
func SetupManagerRoutes(router *gin.Engine, db *sql.DB) {
	handler := NewManagerHandler(db)

	// Manager dashboard routes
	managers := router.Group("/api/v1/managers")
	{
		managers.GET("/:managerId/teams/health", handler.GetManagerTeamsHealth)
		managers.GET("/:managerId/dashboard/radar", handler.GetManagerAggregatedRadar)
		managers.GET("/:managerId/dashboard/trends", handler.GetManagerTrends)
	}
}
