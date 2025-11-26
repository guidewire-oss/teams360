package v1

import (
	"database/sql"
	"net/http"

	"github.com/agopalakrishnan/teams360/backend/interfaces/dto"
	"github.com/gin-gonic/gin"
)

// HierarchyAdminHandler handles hierarchy-level-related admin HTTP requests
type HierarchyAdminHandler struct {
	db *sql.DB
}

// NewHierarchyAdminHandler creates a new HierarchyAdminHandler
func NewHierarchyAdminHandler(db *sql.DB) *HierarchyAdminHandler {
	return &HierarchyAdminHandler{db: db}
}

// ListHierarchyLevels handles GET /api/v1/admin/hierarchy-levels
func (h *HierarchyAdminHandler) ListHierarchyLevels(c *gin.Context) {
	query := `
		SELECT id, name, position,
		       can_view_all_teams, can_edit_teams, can_manage_users,
		       can_take_survey, can_view_analytics,
		       created_at, updated_at
		FROM hierarchy_levels
		ORDER BY position ASC
	`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to query hierarchy levels",
			Message: err.Error(),
		})
		return
	}
	defer rows.Close()

	levels := []dto.HierarchyLevelDTO{}
	for rows.Next() {
		var level dto.HierarchyLevelDTO
		err := rows.Scan(
			&level.ID,
			&level.Name,
			&level.Position,
			&level.Permissions.CanViewAllTeams,
			&level.Permissions.CanEditTeams,
			&level.Permissions.CanManageUsers,
			&level.Permissions.CanTakeSurvey,
			&level.Permissions.CanViewAnalytics,
			&level.CreatedAt,
			&level.UpdatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
				Error:   "Failed to parse hierarchy level",
				Message: err.Error(),
			})
			return
		}
		levels = append(levels, level)
	}

	c.JSON(http.StatusOK, dto.HierarchyLevelsResponse{Levels: levels})
}

// CreateHierarchyLevel handles POST /api/v1/admin/hierarchy-levels
func (h *HierarchyAdminHandler) CreateHierarchyLevel(c *gin.Context) {
	var req dto.CreateHierarchyLevelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "Invalid request body", Message: err.Error()})
		return
	}

	// Get max position and add 1
	var maxPosition int
	err := h.db.QueryRow("SELECT COALESCE(MAX(position), 0) FROM hierarchy_levels WHERE position > 0").Scan(&maxPosition)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to determine position"})
		return
	}
	newPosition := maxPosition + 1

	query := `
		INSERT INTO hierarchy_levels
			(id, name, position, can_view_all_teams, can_edit_teams, can_manage_users, can_take_survey, can_view_analytics)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING created_at, updated_at
	`

	var level dto.HierarchyLevelDTO
	level.ID = req.ID
	level.Name = req.Name
	level.Position = newPosition
	level.Permissions = req.Permissions

	err = h.db.QueryRow(
		query,
		req.ID,
		req.Name,
		newPosition,
		req.Permissions.CanViewAllTeams,
		req.Permissions.CanEditTeams,
		req.Permissions.CanManageUsers,
		req.Permissions.CanTakeSurvey,
		req.Permissions.CanViewAnalytics,
	).Scan(&level.CreatedAt, &level.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to create hierarchy level",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, level)
}

// UpdateHierarchyLevel handles PUT /api/v1/admin/hierarchy-levels/:id
func (h *HierarchyAdminHandler) UpdateHierarchyLevel(c *gin.Context) {
	id := c.Param("id")
	var req dto.UpdateHierarchyLevelRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "Invalid request body", Message: err.Error()})
		return
	}

	// Check if hierarchy level exists
	var exists bool
	err := h.db.QueryRow("SELECT EXISTS(SELECT 1 FROM hierarchy_levels WHERE id = $1)", id).Scan(&exists)
	if err != nil || !exists {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "Hierarchy level not found"})
		return
	}

	query := `
		UPDATE hierarchy_levels
		SET name = COALESCE($1, name),
		    can_view_all_teams = COALESCE($2, can_view_all_teams),
		    can_edit_teams = COALESCE($3, can_edit_teams),
		    can_manage_users = COALESCE($4, can_manage_users),
		    can_take_survey = COALESCE($5, can_take_survey),
		    can_view_analytics = COALESCE($6, can_view_analytics),
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = $7
		RETURNING id, name, position, can_view_all_teams, can_edit_teams, can_manage_users,
		          can_take_survey, can_view_analytics, created_at, updated_at
	`

	var canViewAllTeams, canEditTeams, canManageUsers, canTakeSurvey, canViewAnalytics interface{}
	if req.Permissions != nil {
		canViewAllTeams = req.Permissions.CanViewAllTeams
		canEditTeams = req.Permissions.CanEditTeams
		canManageUsers = req.Permissions.CanManageUsers
		canTakeSurvey = req.Permissions.CanTakeSurvey
		canViewAnalytics = req.Permissions.CanViewAnalytics
	}

	var level dto.HierarchyLevelDTO
	err = h.db.QueryRow(
		query,
		req.Name,
		canViewAllTeams,
		canEditTeams,
		canManageUsers,
		canTakeSurvey,
		canViewAnalytics,
		id,
	).Scan(
		&level.ID,
		&level.Name,
		&level.Position,
		&level.Permissions.CanViewAllTeams,
		&level.Permissions.CanEditTeams,
		&level.Permissions.CanManageUsers,
		&level.Permissions.CanTakeSurvey,
		&level.Permissions.CanViewAnalytics,
		&level.CreatedAt,
		&level.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to update hierarchy level",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, level)
}

// UpdateHierarchyPosition handles PUT /api/v1/admin/hierarchy-levels/:id/position
func (h *HierarchyAdminHandler) UpdateHierarchyPosition(c *gin.Context) {
	id := c.Param("id")
	var req dto.UpdateHierarchyPositionRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "Invalid request body", Message: err.Error()})
		return
	}

	// Get current position
	var currentPosition int
	err := h.db.QueryRow("SELECT position FROM hierarchy_levels WHERE id = $1", id).Scan(&currentPosition)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "Hierarchy level not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Database error"})
		return
	}

	// Start transaction
	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to start transaction"})
		return
	}
	defer tx.Rollback()

	// Shift positions
	if req.NewPosition < currentPosition {
		// Moving up: shift others down
		_, err = tx.Exec(
			"UPDATE hierarchy_levels SET position = position + 1 WHERE position >= $1 AND position < $2 AND position > 0",
			req.NewPosition, currentPosition,
		)
	} else if req.NewPosition > currentPosition {
		// Moving down: shift others up
		_, err = tx.Exec(
			"UPDATE hierarchy_levels SET position = position - 1 WHERE position > $1 AND position <= $2 AND position > 0",
			currentPosition, req.NewPosition,
		)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to reorder levels"})
		return
	}

	// Update the target level
	_, err = tx.Exec("UPDATE hierarchy_levels SET position = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", req.NewPosition, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to update position"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to commit transaction"})
		return
	}

	dto.RespondMessage(c, http.StatusOK, "Position updated successfully")
}

// DeleteHierarchyLevel handles DELETE /api/v1/admin/hierarchy-levels/:id
func (h *HierarchyAdminHandler) DeleteHierarchyLevel(c *gin.Context) {
	id := c.Param("id")

	// Check if any users are using this level
	var userCount int
	err := h.db.QueryRow("SELECT COUNT(*) FROM users WHERE hierarchy_level_id = $1", id).Scan(&userCount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Database error"})
		return
	}

	if userCount > 0 {
		c.JSON(http.StatusConflict, dto.ErrorResponse{
			Error:   "Cannot delete hierarchy level",
			Message: "Users are assigned to this level. Reassign them first.",
		})
		return
	}

	result, err := h.db.Exec("DELETE FROM hierarchy_levels WHERE id = $1 AND position > 0", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to delete hierarchy level",
			Message: err.Error(),
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "Hierarchy level not found or cannot be deleted"})
		return
	}

	dto.RespondMessage(c, http.StatusOK, "Hierarchy level deleted successfully")
}
