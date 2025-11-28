package v1

import (
	"net/http"

	"github.com/agopalakrishnan/teams360/backend/application/services"
	"github.com/agopalakrishnan/teams360/backend/domain/user"
	"github.com/agopalakrishnan/teams360/backend/interfaces/dto"
	"github.com/agopalakrishnan/teams360/backend/pkg/logger"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// AuthHandler handles authentication-related HTTP requests
type AuthHandler struct {
	userRepo   user.Repository
	jwtService *services.JWTService
}

// NewAuthHandler creates a new AuthHandler
func NewAuthHandler(userRepo user.Repository, jwtService *services.JWTService) *AuthHandler {
	return &AuthHandler{
		userRepo:   userRepo,
		jwtService: jwtService,
	}
}

// Login handles user authentication
func (h *AuthHandler) Login(c *gin.Context) {
	log := logger.Get()
	clientIP := c.ClientIP()
	requestID := c.GetString("request_id")
	endpoint := "/api/v1/auth/login"

	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Auth("login").
			IP(clientIP).
			RequestID(requestID).
			Endpoint(endpoint).
			Reason("missing_credentials").
			Details("Request body must contain username and password fields").
			Failure()
		dto.RespondError(c, http.StatusBadRequest, "Username and password are required")
		return
	}

	// Find user by username using repository
	usr, err := h.userRepo.FindByUsername(c.Request.Context(), req.Username)
	if err != nil {
		log.Auth("login").
			Username(req.Username).
			IP(clientIP).
			RequestID(requestID).
			Endpoint(endpoint).
			Reason("user_not_found").
			Details("No user exists with the provided username").
			Failure()
		dto.RespondError(c, http.StatusUnauthorized, "Invalid username or password")
		return
	}

	// Validate password using bcrypt
	if err := bcrypt.CompareHashAndPassword([]byte(usr.PasswordHash), []byte(req.Password)); err != nil {
		log.Auth("login").
			Username(req.Username).
			UserID(usr.ID).
			IP(clientIP).
			RequestID(requestID).
			Endpoint(endpoint).
			Reason("incorrect_password").
			Details("Password does not match stored hash for user").
			Failure()
		dto.RespondError(c, http.StatusUnauthorized, "Invalid username or password")
		return
	}

	// Fetch user's team memberships using repository
	teamIds, err := h.userRepo.FindTeamIDsForUser(c.Request.Context(), usr.ID)
	if err != nil {
		// Log error but don't fail - user might not be in any teams yet
		teamIds = []string{}
	}

	// Also fetch teams where user is the team lead
	leadTeamIds, err := h.userRepo.FindTeamsWhereUserIsLead(c.Request.Context(), usr.ID)
	if err == nil {
		// Merge team IDs, avoiding duplicates
		teamIdSet := make(map[string]bool)
		for _, id := range teamIds {
			teamIdSet[id] = true
		}
		for _, id := range leadTeamIds {
			if !teamIdSet[id] {
				teamIds = append(teamIds, id)
				teamIdSet[id] = true
			}
		}
	}

	// Generate JWT tokens
	tokenPair, err := h.jwtService.GenerateTokenPair(
		c.Request.Context(),
		usr.ID,
		usr.Username,
		usr.Email,
		usr.HierarchyLevelID,
		teamIds,
	)
	if err != nil {
		log.Auth("login").
			UserID(usr.ID).
			IP(clientIP).
			RequestID(requestID).
			Endpoint(endpoint).
			Reason("jwt_generation_failed").
			Details("Failed to generate JWT access and refresh tokens: " + err.Error()).
			Failure()
		dto.RespondError(c, http.StatusInternalServerError, "Failed to generate authentication tokens")
		return
	}

	// Log successful login
	log.Auth("login").
		UserID(usr.ID).
		IP(clientIP).
		RequestID(requestID).
		Endpoint(endpoint).
		Details("User authenticated successfully, JWT tokens issued").
		Success()

	// Return user info with JWT tokens
	response := dto.LoginResponse{
		User: dto.UserDTO{
			ID:             usr.ID,
			Username:       usr.Username,
			Email:          usr.Email,
			FullName:       usr.Name,
			HierarchyLevel: usr.HierarchyLevelID,
			TeamIds:        teamIds,
		},
		AccessToken:  tokenPair.AccessToken,
		RefreshToken: tokenPair.RefreshToken,
		ExpiresIn:    tokenPair.ExpiresIn,
	}

	dto.RespondSuccess(c, http.StatusOK, response)
}

// Refresh handles token refresh requests
func (h *AuthHandler) Refresh(c *gin.Context) {
	log := logger.Get()
	clientIP := c.ClientIP()
	requestID := c.GetString("request_id")
	endpoint := "/api/v1/auth/refresh"

	var req dto.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Auth("token_refresh").
			IP(clientIP).
			RequestID(requestID).
			Endpoint(endpoint).
			Reason("missing_refresh_token").
			Details("Request body must contain refreshToken field").
			Failure()
		dto.RespondError(c, http.StatusBadRequest, "Refresh token is required")
		return
	}

	// Validate refresh token
	userID, err := h.jwtService.ValidateRefreshToken(req.RefreshToken)
	if err != nil {
		reason := "invalid_refresh_token"
		details := "Refresh token failed validation"
		if err.Error() == "token has expired" {
			reason = "refresh_token_expired"
			details = "Refresh token has expired, user must re-authenticate"
		}
		log.Auth("token_refresh").
			IP(clientIP).
			RequestID(requestID).
			Endpoint(endpoint).
			Reason(reason).
			Details(details).
			Failure()
		dto.RespondError(c, http.StatusUnauthorized, "Invalid or expired refresh token")
		return
	}

	// Get user from repository to get current data
	usr, err := h.userRepo.FindByID(c.Request.Context(), userID)
	if err != nil {
		log.Auth("token_refresh").
			UserID(userID).
			IP(clientIP).
			RequestID(requestID).
			Endpoint(endpoint).
			Reason("user_deleted_or_not_found").
			Details("User ID from refresh token no longer exists in database").
			Failure()
		dto.RespondError(c, http.StatusUnauthorized, "User not found")
		return
	}

	// Get team IDs
	teamIds, err := h.userRepo.FindTeamIDsForUser(c.Request.Context(), usr.ID)
	if err != nil {
		teamIds = []string{}
	}

	// Get teams where user is lead
	leadTeamIds, err := h.userRepo.FindTeamsWhereUserIsLead(c.Request.Context(), usr.ID)
	if err == nil {
		teamIdSet := make(map[string]bool)
		for _, id := range teamIds {
			teamIdSet[id] = true
		}
		for _, id := range leadTeamIds {
			if !teamIdSet[id] {
				teamIds = append(teamIds, id)
			}
		}
	}

	// Generate new access token
	newAccessToken, err := h.jwtService.RefreshAccessToken(
		c.Request.Context(),
		req.RefreshToken,
		usr.ID,
		usr.Username,
		usr.Email,
		usr.HierarchyLevelID,
		teamIds,
	)
	if err != nil {
		log.Auth("token_refresh").
			UserID(usr.ID).
			IP(clientIP).
			RequestID(requestID).
			Endpoint(endpoint).
			Reason("access_token_generation_failed").
			Details("Failed to generate new access token from valid refresh token: " + err.Error()).
			Failure()
		dto.RespondError(c, http.StatusUnauthorized, "Failed to refresh token")
		return
	}

	log.Auth("token_refresh").
		UserID(usr.ID).
		IP(clientIP).
		RequestID(requestID).
		Endpoint(endpoint).
		Details("New access token issued successfully").
		Success()

	response := dto.RefreshTokenResponse{
		AccessToken: newAccessToken,
		ExpiresIn:   900, // 15 minutes in seconds (default)
	}

	dto.RespondSuccess(c, http.StatusOK, response)
}

// Logout handles user logout (token invalidation)
func (h *AuthHandler) Logout(c *gin.Context) {
	log := logger.Get()
	clientIP := c.ClientIP()
	requestID := c.GetString("request_id")
	endpoint := "/api/v1/auth/logout"

	// Try to get user ID from context if authenticated
	userID, exists := c.Get("user_id")
	if exists {
		log.Auth("logout").
			UserID(userID.(string)).
			IP(clientIP).
			RequestID(requestID).
			Endpoint(endpoint).
			Details("User session ended, client should discard tokens").
			Success()
	} else {
		// Log logout attempt without user context (unauthenticated logout request)
		log.Auth("logout").
			IP(clientIP).
			RequestID(requestID).
			Endpoint(endpoint).
			Details("Logout requested without authenticated session").
			Success()
	}

	// For stateless JWT, logout is handled client-side by removing tokens
	// In a production system, you would add the token to a blacklist
	dto.RespondSuccess(c, http.StatusOK, gin.H{"message": "Logged out successfully"})
}
