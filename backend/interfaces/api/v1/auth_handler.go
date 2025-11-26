package v1

import (
	"net/http"

	"github.com/agopalakrishnan/teams360/backend/domain/user"
	"github.com/agopalakrishnan/teams360/backend/interfaces/dto"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// AuthHandler handles authentication-related HTTP requests
type AuthHandler struct {
	userRepo user.Repository
}

// NewAuthHandler creates a new AuthHandler
func NewAuthHandler(userRepo user.Repository) *AuthHandler {
	return &AuthHandler{userRepo: userRepo}
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

	// Return user info (excluding password)
	response := dto.LoginResponse{
		User: dto.UserDTO{
			ID:             usr.ID,
			Username:       usr.Username,
			Email:          usr.Email,
			FullName:       usr.Name,
			HierarchyLevel: usr.HierarchyLevelID,
			TeamIds:        teamIds,
		},
	}

	dto.RespondSuccess(c, http.StatusOK, response)
}
