package v1

import (
	"database/sql"

	"github.com/gin-gonic/gin"
)

// SetupUserRoutes registers user-related routes
// TODO: Update signature to accept healthcheck.Repository instead of *sql.DB
// Target: func SetupUserRoutes(router *gin.Engine, healthCheckRepo healthcheck.Repository)
// User survey history queries health check sessions, so it needs healthcheck.Repository
func SetupUserRoutes(router *gin.Engine, db *sql.DB) {
	handler := NewUserHandler(db)

	router.GET("/api/v1/users/:userId/survey-history", handler.GetUserSurveyHistory)
}
