package v1

import (
	"database/sql"
	"net/http"

	"github.com/agopalakrishnan/teams360/backend/interfaces/dto"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// UserAdminHandler handles user-related admin HTTP requests
type UserAdminHandler struct {
	db *sql.DB
}

// NewUserAdminHandler creates a new UserAdminHandler
func NewUserAdminHandler(db *sql.DB) *UserAdminHandler {
	return &UserAdminHandler{db: db}
}

// ListUsers handles GET /api/v1/admin/users
func (h *UserAdminHandler) ListUsers(c *gin.Context) {
	query := `
		SELECT u.id, u.username, u.email, u.full_name, u.hierarchy_level_id,
		       u.reports_to, u.created_at, u.updated_at
		FROM users u
		ORDER BY u.full_name ASC
	`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to query users",
			Message: err.Error(),
		})
		return
	}
	defer rows.Close()

	users := []dto.AdminUserDTO{}
	for rows.Next() {
		var user dto.AdminUserDTO
		err := rows.Scan(
			&user.ID,
			&user.Username,
			&user.Email,
			&user.FullName,
			&user.HierarchyLevel,
			&user.ReportsTo,
			&user.CreatedAt,
			&user.UpdatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
				Error:   "Failed to parse user",
				Message: err.Error(),
			})
			return
		}

		// Fetch team IDs
		teamQuery := `SELECT team_id FROM team_members WHERE user_id = $1`
		teamRows, err := h.db.Query(teamQuery, user.ID)
		if err == nil {
			defer teamRows.Close()
			user.TeamIds = []string{}
			for teamRows.Next() {
				var teamID string
				if err := teamRows.Scan(&teamID); err == nil {
					user.TeamIds = append(user.TeamIds, teamID)
				}
			}
		}

		users = append(users, user)
	}

	c.JSON(http.StatusOK, dto.UsersResponse{
		Users: users,
		Total: len(users),
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

	query := `
		INSERT INTO users (id, username, email, full_name, hierarchy_level_id, reports_to, password_hash)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING created_at, updated_at
	`

	var user dto.AdminUserDTO
	user.ID = req.ID
	user.Username = req.Username
	user.Email = req.Email
	user.FullName = req.FullName
	user.HierarchyLevel = req.HierarchyLevel
	user.ReportsTo = req.ReportsTo
	user.TeamIds = []string{}

	err = h.db.QueryRow(
		query,
		req.ID,
		req.Username,
		req.Email,
		req.FullName,
		req.HierarchyLevel,
		req.ReportsTo,
		string(hashedPassword),
	).Scan(&user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to create user",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, user)
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
	var exists bool
	err := h.db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE id = $1)", id).Scan(&exists)
	if err != nil || !exists {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "User not found"})
		return
	}

	var hashedPassword interface{}
	if req.Password != nil {
		hashed, err := bcrypt.GenerateFromPassword([]byte(*req.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to hash password"})
			return
		}
		hashedPassword = string(hashed)
	}

	query := `
		UPDATE users
		SET username = COALESCE($1, username),
		    email = COALESCE($2, email),
		    full_name = COALESCE($3, full_name),
		    hierarchy_level_id = COALESCE($4, hierarchy_level_id),
		    reports_to = COALESCE($5, reports_to),
		    password_hash = COALESCE($6, password_hash),
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = $7
		RETURNING id, username, email, full_name, hierarchy_level_id, reports_to, created_at, updated_at
	`

	var user dto.AdminUserDTO
	err = h.db.QueryRow(
		query,
		req.Username,
		req.Email,
		req.FullName,
		req.HierarchyLevel,
		req.ReportsTo,
		hashedPassword,
		id,
	).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.FullName,
		&user.HierarchyLevel,
		&user.ReportsTo,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to update user",
			Message: err.Error(),
		})
		return
	}

	// Fetch team IDs
	teamQuery := `SELECT team_id FROM team_members WHERE user_id = $1`
	teamRows, err := h.db.Query(teamQuery, user.ID)
	if err == nil {
		defer teamRows.Close()
		user.TeamIds = []string{}
		for teamRows.Next() {
			var teamID string
			if err := teamRows.Scan(&teamID); err == nil {
				user.TeamIds = append(user.TeamIds, teamID)
			}
		}
	}

	c.JSON(http.StatusOK, user)
}

// DeleteUser handles DELETE /api/v1/admin/users/:id
func (h *UserAdminHandler) DeleteUser(c *gin.Context) {
	id := c.Param("id")

	result, err := h.db.Exec("DELETE FROM users WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to delete user",
			Message: err.Error(),
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "User not found"})
		return
	}

	dto.RespondMessage(c, http.StatusOK, "User deleted successfully")
}
