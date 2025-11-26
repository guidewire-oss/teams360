package v1

import (
	"database/sql"
	"net/http"

	"github.com/agopalakrishnan/teams360/backend/interfaces/dto"
	"github.com/gin-gonic/gin"
)

// SettingsAdminHandler handles settings-related admin HTTP requests
type SettingsAdminHandler struct {
	db *sql.DB
}

// NewSettingsAdminHandler creates a new SettingsAdminHandler
func NewSettingsAdminHandler(db *sql.DB) *SettingsAdminHandler {
	return &SettingsAdminHandler{db: db}
}

// GetDimensions handles GET /api/v1/admin/settings/dimensions
func (h *SettingsAdminHandler) GetDimensions(c *gin.Context) {
	query := `
		SELECT id, name, description, good_description, bad_description,
		       is_active, weight, created_at, updated_at
		FROM health_dimensions
		ORDER BY name ASC
	`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to query dimensions",
			Message: err.Error(),
		})
		return
	}
	defer rows.Close()

	dimensions := []dto.HealthDimensionDTO{}
	for rows.Next() {
		var dim dto.HealthDimensionDTO
		err := rows.Scan(
			&dim.ID,
			&dim.Name,
			&dim.Description,
			&dim.GoodDescription,
			&dim.BadDescription,
			&dim.IsActive,
			&dim.Weight,
			&dim.CreatedAt,
			&dim.UpdatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
				Error:   "Failed to parse dimension",
				Message: err.Error(),
			})
			return
		}
		dimensions = append(dimensions, dim)
	}

	c.JSON(http.StatusOK, dto.DimensionsResponse{Dimensions: dimensions})
}

// UpdateDimension handles PUT /api/v1/admin/settings/dimensions/:id
func (h *SettingsAdminHandler) UpdateDimension(c *gin.Context) {
	id := c.Param("id")
	var req dto.UpdateDimensionRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "Invalid request body", Message: err.Error()})
		return
	}

	// Validate weight if provided
	if req.Weight != nil && (*req.Weight < 0 || *req.Weight > 10) {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "Weight must be between 0 and 10"})
		return
	}

	query := `
		UPDATE health_dimensions
		SET is_active = COALESCE($1, is_active),
		    weight = COALESCE($2, weight),
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = $3
		RETURNING id, name, description, good_description, bad_description,
		          is_active, weight, created_at, updated_at
	`

	var dim dto.HealthDimensionDTO
	err := h.db.QueryRow(query, req.IsActive, req.Weight, id).Scan(
		&dim.ID,
		&dim.Name,
		&dim.Description,
		&dim.GoodDescription,
		&dim.BadDescription,
		&dim.IsActive,
		&dim.Weight,
		&dim.CreatedAt,
		&dim.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "Dimension not found"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to update dimension",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dim)
}

// GetNotificationSettings handles GET /api/v1/admin/settings/notifications
func (h *SettingsAdminHandler) GetNotificationSettings(c *gin.Context) {
	// Placeholder implementation - would typically read from a settings table
	settings := dto.NotificationSettings{
		EmailEnabled:       false,
		SlackEnabled:       false,
		NotifyOnSubmission: false,
		NotifyManagers:     false,
		ReminderDaysBefore: 7,
		ReminderRecipients: []string{},
	}

	c.JSON(http.StatusOK, settings)
}

// UpdateNotificationSettings handles PUT /api/v1/admin/settings/notifications
func (h *SettingsAdminHandler) UpdateNotificationSettings(c *gin.Context) {
	var settings dto.NotificationSettings
	if err := c.ShouldBindJSON(&settings); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "Invalid request body", Message: err.Error()})
		return
	}

	// Placeholder implementation - would typically write to a settings table
	c.JSON(http.StatusOK, settings)
}

// GetRetentionPolicy handles GET /api/v1/admin/settings/retention
func (h *SettingsAdminHandler) GetRetentionPolicy(c *gin.Context) {
	// Placeholder implementation - would typically read from a settings table
	policy := dto.RetentionPolicy{
		KeepSessionsMonths: 12,
		ArchiveEnabled:     false,
		AnonymizeAfterDays: 365,
	}

	c.JSON(http.StatusOK, policy)
}

// UpdateRetentionPolicy handles PUT /api/v1/admin/settings/retention
func (h *SettingsAdminHandler) UpdateRetentionPolicy(c *gin.Context) {
	var policy dto.RetentionPolicy
	if err := c.ShouldBindJSON(&policy); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "Invalid request body", Message: err.Error()})
		return
	}

	// Validate values
	if policy.KeepSessionsMonths < 1 || policy.KeepSessionsMonths > 120 {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "Keep sessions months must be between 1 and 120"})
		return
	}

	if policy.AnonymizeAfterDays < 30 {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "Anonymize after days must be at least 30"})
		return
	}

	// Placeholder implementation - would typically write to a settings table
	c.JSON(http.StatusOK, policy)
}
