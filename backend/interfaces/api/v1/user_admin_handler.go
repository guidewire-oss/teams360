package v1

import (
	"net/http"

	"github.com/agopalakrishnan/teams360/backend/domain/user"
	"github.com/agopalakrishnan/teams360/backend/interfaces/dto"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// UserAdminHandler handles user-related admin HTTP requests
type UserAdminHandler struct {
	userRepo user.Repository
}

// NewUserAdminHandler creates a new UserAdminHandler
func NewUserAdminHandler(userRepo user.Repository) *UserAdminHandler {
	return &UserAdminHandler{userRepo: userRepo}
}

// ListUsers handles GET /api/v1/admin/users
func (h *UserAdminHandler) ListUsers(c *gin.Context) {
	users, err := h.userRepo.FindAll(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to query users",
			Message: err.Error(),
		})
		return
	}

	// Convert to DTOs
	userDTOs := make([]dto.AdminUserDTO, len(users))
	for i, usr := range users {
		// Fetch team IDs
		teamIds, _ := h.userRepo.FindTeamIDsForUser(c.Request.Context(), usr.ID)
		if teamIds == nil {
			teamIds = []string{}
		}

		userDTOs[i] = dto.AdminUserDTO{
			ID:             usr.ID,
			Username:       usr.Username,
			Email:          usr.Email,
			FullName:       usr.Name,
			HierarchyLevel: usr.HierarchyLevelID,
			ReportsTo:      usr.ReportsTo,
			TeamIds:        teamIds,
			CreatedAt:      usr.CreatedAt,
			UpdatedAt:      usr.UpdatedAt,
		}
	}

	c.JSON(http.StatusOK, dto.UsersResponse{
		Users: userDTOs,
		Total: len(userDTOs),
	})
}

// CreateUser handles POST /api/v1/admin/users
func (h *UserAdminHandler) CreateUser(c *gin.Context) {
	var req dto.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "Invalid request body", Message: err.Error()})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to hash password"})
		return
	}

	// Create user domain model
	usr := &user.User{
		ID:               req.ID,
		Username:         req.Username,
		Email:            req.Email,
		Name:             req.FullName,
		HierarchyLevelID: req.HierarchyLevel,
		ReportsTo:        req.ReportsTo,
		PasswordHash:     string(hashedPassword),
		TeamIDs:          []string{},
	}

	// Save using repository
	if err := h.userRepo.Save(c.Request.Context(), usr); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to create user",
			Message: err.Error(),
		})
		return
	}

	// Convert to DTO and return
	responseDTO := dto.AdminUserDTO{
		ID:             usr.ID,
		Username:       usr.Username,
		Email:          usr.Email,
		FullName:       usr.Name,
		HierarchyLevel: usr.HierarchyLevelID,
		ReportsTo:      usr.ReportsTo,
		TeamIds:        usr.TeamIDs,
		CreatedAt:      usr.CreatedAt,
		UpdatedAt:      usr.UpdatedAt,
	}

	c.JSON(http.StatusCreated, responseDTO)
}

// UpdateUser handles PUT /api/v1/admin/users/:id
func (h *UserAdminHandler) UpdateUser(c *gin.Context) {
	id := c.Param("id")
	var req dto.UpdateUserRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "Invalid request body", Message: err.Error()})
		return
	}

	// Check if user exists
	usr, err := h.userRepo.FindByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "User not found"})
		return
	}

	// Update fields if provided
	if req.Username != nil {
		usr.Username = *req.Username
	}
	if req.Email != nil {
		usr.Email = *req.Email
	}
	if req.FullName != nil {
		usr.Name = *req.FullName
	}
	if req.HierarchyLevel != nil {
		usr.HierarchyLevelID = *req.HierarchyLevel
	}
	if req.ReportsTo != nil {
		usr.ReportsTo = req.ReportsTo
	}
	if req.Password != nil {
		hashed, err := bcrypt.GenerateFromPassword([]byte(*req.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to hash password"})
			return
		}
		usr.PasswordHash = string(hashed)
	}

	// Update using repository
	if err := h.userRepo.Update(c.Request.Context(), usr); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to update user",
			Message: err.Error(),
		})
		return
	}

	// Fetch team IDs
	teamIds, _ := h.userRepo.FindTeamIDsForUser(c.Request.Context(), usr.ID)
	if teamIds == nil {
		teamIds = []string{}
	}

	// Convert to DTO and return
	responseDTO := dto.AdminUserDTO{
		ID:             usr.ID,
		Username:       usr.Username,
		Email:          usr.Email,
		FullName:       usr.Name,
		HierarchyLevel: usr.HierarchyLevelID,
		ReportsTo:      usr.ReportsTo,
		TeamIds:        teamIds,
		CreatedAt:      usr.CreatedAt,
		UpdatedAt:      usr.UpdatedAt,
	}

	c.JSON(http.StatusOK, responseDTO)
}

// DeleteUser handles DELETE /api/v1/admin/users/:id
func (h *UserAdminHandler) DeleteUser(c *gin.Context) {
	id := c.Param("id")

	if err := h.userRepo.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to delete user",
			Message: err.Error(),
		})
		return
	}

	dto.RespondMessage(c, http.StatusOK, "User deleted successfully")
}
