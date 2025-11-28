package v1

import (
	"net/http"

	"github.com/agopalakrishnan/teams360/backend/application/services"
	"github.com/agopalakrishnan/teams360/backend/domain/user"
	"github.com/agopalakrishnan/teams360/backend/interfaces/dto"
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
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		dto.RespondError(c, http.StatusBadRequest, "Username and password are required")
		return
	}

	// Find user by username using repository
	usr, err := h.userRepo.FindByUsername(c.Request.Context(), req.Username)
	if err != nil {
		dto.RespondError(c, http.StatusUnauthorized, "Invalid username or password")
		return
	}

	// Validate password using bcrypt
	if err := bcrypt.CompareHashAndPassword([]byte(usr.PasswordHash), []byte(req.Password)); err != nil {
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
		dto.RespondError(c, http.StatusInternalServerError, "Failed to generate authentication tokens")
		return
	}

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
	var req dto.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		dto.RespondError(c, http.StatusBadRequest, "Refresh token is required")
		return
	}

	// Validate refresh token
	userID, err := h.jwtService.ValidateRefreshToken(req.RefreshToken)
	if err != nil {
		dto.RespondError(c, http.StatusUnauthorized, "Invalid or expired refresh token")
		return
	}

	// Get user from repository to get current data
	usr, err := h.userRepo.FindByID(c.Request.Context(), userID)
	if err != nil {
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
		dto.RespondError(c, http.StatusUnauthorized, "Failed to refresh token")
		return
	}

	response := dto.RefreshTokenResponse{
		AccessToken: newAccessToken,
		ExpiresIn:   900, // 15 minutes in seconds (default)
	}

	dto.RespondSuccess(c, http.StatusOK, response)
}

// Logout handles user logout (token invalidation)
func (h *AuthHandler) Logout(c *gin.Context) {
	// For stateless JWT, logout is handled client-side by removing tokens
	// In a production system, you would add the token to a blacklist
	dto.RespondSuccess(c, http.StatusOK, gin.H{"message": "Logged out successfully"})
}
