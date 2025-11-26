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
		dto.RespondError(c, http.StatusBadRequest, "Username and password are required")
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
		dto.RespondError(c, http.StatusUnauthorized, "Invalid username or password")
		return
	}

	if err != nil {
		dto.RespondError(c, http.StatusInternalServerError, "Database error")
		return
	}

	// Validate password using bcrypt
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		dto.RespondError(c, http.StatusUnauthorized, "Invalid username or password")
		return
	}

	// Fetch user's team memberships (from team_members table)
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

	// Also fetch teams where user is the team lead
	teamLeadQuery := `SELECT id FROM teams WHERE team_lead_id = $1`
	leadRows, err := h.db.Query(teamLeadQuery, user.ID)
	if err == nil {
		defer leadRows.Close()
		for leadRows.Next() {
			var teamID string
			if err := leadRows.Scan(&teamID); err == nil {
				// Avoid duplicates
				found := false
				for _, existingID := range teamIds {
					if existingID == teamID {
						found = true
						break
					}
				}
				if !found {
					teamIds = append(teamIds, teamID)
				}
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

	dto.RespondSuccess(c, http.StatusOK, response)
}
