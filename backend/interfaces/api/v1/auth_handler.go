package v1

import (
	"database/sql"
	"net/http"

	"github.com/agopalakrishnan/teams360/backend/interfaces/dto"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// AuthHandler handles authentication-related HTTP requests
type AuthHandler struct {
	db *sql.DB
}

// NewAuthHandler creates a new AuthHandler
func NewAuthHandler(db *sql.DB) *AuthHandler {
	return &AuthHandler{db: db}
}

// Login handles user authentication
func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username and password are required"})
		return
	}

	// Query user from database
	var user struct {
		ID             string
		Username       string
		Email          string
		FullName       string
		HierarchyLevel string
		PasswordHash   string
	}

	query := `SELECT id, username, email, full_name, hierarchy_level_id, password_hash
	          FROM users WHERE username = $1`
	err := h.db.QueryRow(query, req.Username).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.FullName,
		&user.HierarchyLevel,
		&user.PasswordHash,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Validate password using bcrypt
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	// Fetch user's team memberships
	teamIds := []string{}
	teamQuery := `SELECT team_id FROM team_members WHERE user_id = $1`
	rows, err := h.db.Query(teamQuery, user.ID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var teamID string
			if err := rows.Scan(&teamID); err == nil {
				teamIds = append(teamIds, teamID)
			}
		}
	}

	// Return user info (excluding password)
	response := dto.LoginResponse{
		User: dto.UserDTO{
			ID:             user.ID,
			Username:       user.Username,
			Email:          user.Email,
			FullName:       user.FullName,
			HierarchyLevel: user.HierarchyLevel,
			TeamIds:        teamIds,
		},
	}

	c.JSON(http.StatusOK, response)
}
