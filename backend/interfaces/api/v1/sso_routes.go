package v1

import (
	"github.com/agopalakrishnan/teams360/backend/application/services"
	"github.com/agopalakrishnan/teams360/backend/domain/user"
	"github.com/gin-gonic/gin"
)

// SetupSSORoutes registers the SSO/OAuth endpoints.
func SetupSSORoutes(router *gin.Engine, userRepo user.Repository, jwtService *services.JWTService) {
	h := NewSSOHandler(userRepo, jwtService)

	sso := router.Group("/api/v1/auth/sso")
	{
		sso.POST("/callback", h.Callback)
	}
}
