package dto

import "time"

// ============================================================================
// Hierarchy Levels DTOs
// ============================================================================

// HierarchyLevelDTO represents a hierarchy level with permissions
type HierarchyLevelDTO struct {
	ID          string                  `json:"id"`
	Name        string                  `json:"name"`
	Position    int                     `json:"position"`
	Permissions HierarchyPermissionsDTO `json:"permissions"`
	CreatedAt   time.Time               `json:"createdAt"`
	UpdatedAt   time.Time               `json:"updatedAt"`
}

// HierarchyPermissionsDTO represents permissions for a hierarchy level
type HierarchyPermissionsDTO struct {
	CanViewAllTeams  bool `json:"canViewAllTeams"`
	CanEditTeams     bool `json:"canEditTeams"`
	CanManageUsers   bool `json:"canManageUsers"`
	CanTakeSurvey    bool `json:"canTakeSurvey"`
	CanViewAnalytics bool `json:"canViewAnalytics"`
}

// CreateHierarchyLevelRequest represents request to create a hierarchy level
type CreateHierarchyLevelRequest struct {
	ID          string                  `json:"id" binding:"required"`
	Name        string                  `json:"name" binding:"required"`
	Permissions HierarchyPermissionsDTO `json:"permissions"`
}

// UpdateHierarchyLevelRequest represents request to update a hierarchy level
type UpdateHierarchyLevelRequest struct {
	Name        string                   `json:"name"`
	Permissions *HierarchyPermissionsDTO `json:"permissions"`
}

// UpdateHierarchyPositionRequest represents request to reorder hierarchy levels
type UpdateHierarchyPositionRequest struct {
	NewPosition int `json:"newPosition" binding:"required,min=1"`
}

// HierarchyLevelsResponse represents response with list of hierarchy levels
type HierarchyLevelsResponse struct {
	Levels []HierarchyLevelDTO `json:"levels"`
}

// ============================================================================
// Users DTOs
// ============================================================================

// AdminUserDTO represents detailed user information for admin
type AdminUserDTO struct {
	ID             string    `json:"id"`
	Username       string    `json:"username"`
	Email          string    `json:"email"`
	FullName       string    `json:"fullName"`
	HierarchyLevel string    `json:"hierarchyLevel"`
	ReportsTo      *string   `json:"reportsTo"`
	TeamIds        []string  `json:"teamIds"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

// CreateUserRequest represents request to create a user
type CreateUserRequest struct {
	ID             string  `json:"id" binding:"required"`
	Username       string  `json:"username" binding:"required"`
	Email          string  `json:"email" binding:"required,email"`
	FullName       string  `json:"fullName" binding:"required"`
	Password       string  `json:"password" binding:"required,min=4"`
	HierarchyLevel string  `json:"hierarchyLevel" binding:"required"`
	ReportsTo      *string `json:"reportsTo"`
}

// UpdateUserRequest represents request to update a user
type UpdateUserRequest struct {
	Username       *string `json:"username"`
	Email          *string `json:"email"`
	FullName       *string `json:"fullName"`
	Password       *string `json:"password"`
	HierarchyLevel *string `json:"hierarchyLevel"`
	ReportsTo      *string `json:"reportsTo"`
}

// UsersResponse represents response with list of users
type UsersResponse struct {
	Users []AdminUserDTO `json:"users"`
	Total int            `json:"total"`
}

// ============================================================================
// Teams DTOs
// ============================================================================

// AdminTeamDTO represents detailed team information for admin
type AdminTeamDTO struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	TeamLeadID   *string   `json:"teamLeadId"`
	TeamLeadName *string   `json:"teamLeadName"`
	Cadence      string    `json:"cadence"`
	MemberCount  int       `json:"memberCount"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// CreateTeamRequest represents request to create a team
type CreateTeamRequest struct {
	ID         string  `json:"id" binding:"required"`
	Name       string  `json:"name" binding:"required"`
	TeamLeadID *string `json:"teamLeadId"`
	Cadence    string  `json:"cadence" binding:"required,oneof=weekly biweekly monthly quarterly"`
}

// UpdateTeamRequest represents request to update a team
type UpdateTeamRequest struct {
	Name       *string `json:"name"`
	TeamLeadID *string `json:"teamLeadId"`
	Cadence    *string `json:"cadence"`
}

// TeamsResponse represents response with list of teams
type TeamsResponse struct {
	Teams []AdminTeamDTO `json:"teams"`
	Total int            `json:"total"`
}

// ============================================================================
// Settings DTOs
// ============================================================================

// HealthDimensionDTO represents a health check dimension
type HealthDimensionDTO struct {
	ID              string    `json:"id"`
	Name            string    `json:"name"`
	Description     string    `json:"description"`
	GoodDescription string    `json:"goodDescription"`
	BadDescription  string    `json:"badDescription"`
	IsActive        bool      `json:"isActive"`
	Weight          float64   `json:"weight"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

// UpdateDimensionRequest represents request to update a dimension
type UpdateDimensionRequest struct {
	IsActive *bool    `json:"isActive"`
	Weight   *float64 `json:"weight"`
}

// DimensionsResponse represents response with list of dimensions
type DimensionsResponse struct {
	Dimensions []HealthDimensionDTO `json:"dimensions"`
}

// NotificationSettings represents notification configuration
type NotificationSettings struct {
	EmailEnabled        bool     `json:"emailEnabled"`
	SlackEnabled        bool     `json:"slackEnabled"`
	NotifyOnSubmission  bool     `json:"notifyOnSubmission"`
	NotifyManagers      bool     `json:"notifyManagers"`
	ReminderDaysBefore  int      `json:"reminderDaysBefore"`
	ReminderRecipients  []string `json:"reminderRecipients"`
}

// RetentionPolicy represents data retention configuration
type RetentionPolicy struct {
	KeepSessionsMonths int  `json:"keepSessionsMonths"`
	ArchiveEnabled     bool `json:"archiveEnabled"`
	AnonymizeAfterDays int  `json:"anonymizeAfterDays"`
}
