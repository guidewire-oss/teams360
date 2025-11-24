package v1

import (
	"database/sql"

	"github.com/gin-gonic/gin"

	"github.com/agopalakrishnan/teams360/backend/domain/healthcheck"
)

// SetupHealthCheckRoutes registers health check routes
func SetupHealthCheckRoutes(router *gin.Engine, repository healthcheck.Repository) {
	// This will be called with a database connection in real usage
	// For now, we'll need to pass the DB separately
	// In a real application, this would come from dependency injection

	handler := &HealthCheckHandler{
		repository: repository,
	}

	// Health check routes
	router.POST("/api/v1/health-checks", handler.SubmitHealthCheck)
	router.GET("/api/v1/health-dimensions", handler.GetHealthDimensions)
	router.GET("/api/v1/health-checks/:id", handler.GetHealthCheckByID)
	// Using /health-checks/team/:id to avoid conflict with /teams/:id
	router.GET("/api/v1/health-checks/team/:id", handler.GetTeamHealthChecks)
}

// SetupHealthCheckRoutesWithDB registers routes with database connection
func SetupHealthCheckRoutesWithDB(router *gin.Engine, db *sql.DB, repository healthcheck.Repository) {
	handler := NewHealthCheckHandler(db, repository)

	router.POST("/api/v1/health-checks", handler.SubmitHealthCheck)
	router.GET("/api/v1/health-dimensions", handler.GetHealthDimensions)
	router.GET("/api/v1/health-checks/:id", handler.GetHealthCheckByID)
	// Using /health-checks/team/:id to avoid conflict with /teams/:id
	router.GET("/api/v1/health-checks/team/:id", handler.GetTeamHealthChecks)
}
