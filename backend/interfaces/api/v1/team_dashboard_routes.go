package v1

import (
	"database/sql"

	"github.com/gin-gonic/gin"
)

// SetupTeamDashboardRoutes registers team lead dashboard routes
// TODO: Update signature to accept healthcheck.Repository instead of *sql.DB
// Target: func SetupTeamDashboardRoutes(router *gin.Engine, healthCheckRepo healthcheck.Repository)
// Dashboard queries health check sessions and responses, so it needs healthcheck.Repository
func SetupTeamDashboardRoutes(router *gin.Engine, db *sql.DB) {
	handler := NewTeamDashboardHandler(db)

	// Team Lead Dashboard routes
	router.GET("/api/v1/teams/:teamId/dashboard/health-summary", handler.GetHealthSummary)
	router.GET("/api/v1/teams/:teamId/dashboard/response-distribution", handler.GetResponseDistribution)
	router.GET("/api/v1/teams/:teamId/dashboard/individual-responses", handler.GetIndividualResponses)
	router.GET("/api/v1/teams/:teamId/dashboard/trends", handler.GetTrends)
}
