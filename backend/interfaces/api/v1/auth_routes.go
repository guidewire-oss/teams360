package v1

import (
	"github.com/agopalakrishnan/teams360/backend/domain/user"
	"github.com/gin-gonic/gin"
)

// SetupAuthRoutes configures authentication routes with repository dependency injection
func SetupAuthRoutes(router *gin.Engine, userRepo user.Repository) {
	authHandler := NewAuthHandler(userRepo)

	// Authentication routes
	auth := router.Group("/api/v1/auth")
	{
		auth.POST("/login", authHandler.Login)
	}
}
