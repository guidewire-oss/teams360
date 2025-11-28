package middleware

import (
	"net/http"
	"strings"

	"github.com/agopalakrishnan/teams360/backend/application/services"
	"github.com/agopalakrishnan/teams360/backend/interfaces/dto"
	"github.com/agopalakrishnan/teams360/backend/pkg/logger"
	"github.com/gin-gonic/gin"
)

// JWTAuthMiddleware creates a middleware that validates JWT tokens
func JWTAuthMiddleware(jwtService *services.JWTService) gin.HandlerFunc {
	return func(c *gin.Context) {
		log := logger.Get()
		clientIP := c.ClientIP()
		requestID := c.GetString("request_id")
		endpoint := c.Request.URL.Path

		// Get Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			log.Auth("token_validation").
				IP(clientIP).
				RequestID(requestID).
				Endpoint(endpoint).
				Reason("missing_authorization_header").
				Details("Request to protected endpoint lacks Authorization header").
				Failure()
			dto.RespondError(c, http.StatusUnauthorized, "Authorization header is required")
			c.Abort()
			return
		}

		// Check Bearer prefix
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			log.Auth("token_validation").
				IP(clientIP).
				RequestID(requestID).
				Endpoint(endpoint).
				Reason("invalid_authorization_format").
				Details("Authorization header must use 'Bearer <token>' format").
				Failure()
			dto.RespondError(c, http.StatusUnauthorized, "Authorization header must be Bearer token")
			c.Abort()
			return
		}

		tokenString := parts[1]

		// Validate token
		claims, err := jwtService.ValidateAccessToken(tokenString)
		if err != nil {
			var reason, details string
			switch err {
			case services.ErrExpiredToken:
				reason = "access_token_expired"
				details = "JWT access token has expired, client should use refresh token to obtain new access token"
				dto.RespondError(c, http.StatusUnauthorized, "Token has expired")
			case services.ErrInvalidToken:
				reason = "access_token_invalid"
				details = "JWT access token is malformed, tampered with, or signed with wrong key"
				dto.RespondError(c, http.StatusUnauthorized, "Invalid token")
			default:
				reason = "token_validation_error"
				details = "Unexpected error during token validation: " + err.Error()
				dto.RespondError(c, http.StatusUnauthorized, "Authentication failed")
			}
			log.Auth("token_validation").
				IP(clientIP).
				RequestID(requestID).
				Endpoint(endpoint).
				Reason(reason).
				Details(details).
				Failure()
			c.Abort()
			return
		}

		// Store user info in context for downstream handlers
		c.Set("userID", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("email", claims.Email)
		c.Set("hierarchyLevel", claims.HierarchyLevel)
		c.Set("teamIDs", claims.TeamIDs)
		c.Set("claims", claims)

		c.Next()
	}
}

// OptionalJWTAuthMiddleware validates JWT if present but doesn't require it
func OptionalJWTAuthMiddleware(jwtService *services.JWTService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.Next()
			return
		}

		tokenString := parts[1]
		claims, err := jwtService.ValidateAccessToken(tokenString)
		if err != nil {
			c.Next()
			return
		}

		// Store user info in context
		c.Set("userID", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("email", claims.Email)
		c.Set("hierarchyLevel", claims.HierarchyLevel)
		c.Set("teamIDs", claims.TeamIDs)
		c.Set("claims", claims)

		c.Next()
	}
}

// GetUserIDFromContext extracts user ID from gin context
func GetUserIDFromContext(c *gin.Context) (string, bool) {
	userID, exists := c.Get("userID")
	if !exists {
		return "", false
	}
	return userID.(string), true
}

// GetClaimsFromContext extracts JWT claims from gin context
func GetClaimsFromContext(c *gin.Context) (*services.TokenClaims, bool) {
	claims, exists := c.Get("claims")
	if !exists {
		return nil, false
	}
	return claims.(*services.TokenClaims), true
}
