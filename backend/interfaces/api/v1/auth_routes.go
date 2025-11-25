package v1

import (
	"database/sql"

	"github.com/gin-gonic/gin"
)

// SetupAuthRoutes configures authentication routes with database dependency injection
func SetupAuthRoutes(router *gin.Engine, db *sql.DB) {
	authHandler := NewAuthHandler(db)

	// Authentication routes
	auth := router.Group("/api/v1/auth")
	{
		auth.POST("/login", authHandler.Login)
	}
}
