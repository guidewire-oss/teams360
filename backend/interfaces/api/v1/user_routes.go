package v1

import (
	"database/sql"

	"github.com/gin-gonic/gin"
)

// SetupUserRoutes registers user-related routes
func SetupUserRoutes(router *gin.Engine, db *sql.DB) {
	handler := NewUserHandler(db)

	router.GET("/api/v1/users/:userId/survey-history", handler.GetUserSurveyHistory)
}
