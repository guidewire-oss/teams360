package organization

// HierarchyLevel defines a level in the organizational hierarchy
type HierarchyLevel struct {
	ID          string      `json:"id"`
	Name        string      `json:"name"`
	Level       int         `json:"level"`
	Color       string      `json:"color"`
	Permissions Permissions `json:"permissions"`
}

// Permissions defines what a hierarchy level can do
type Permissions struct {
	CanViewAllTeams    bool `json:"canViewAllTeams"`
	CanEditTeams       bool `json:"canEditTeams"`
	CanManageUsers     bool `json:"canManageUsers"`
	CanConfigureSystem bool `json:"canConfigureSystem"`
	CanViewReports     bool `json:"canViewReports"`
	CanExportData      bool `json:"canExportData"`
}

// OrganizationConfig represents the organization configuration
// This is an aggregate root in DDD terms
type OrganizationConfig struct {
	ID                string           `json:"id"`
	CompanyName       string           `json:"companyName"`
	HierarchyLevels   []HierarchyLevel `json:"hierarchyLevels"`
	TeamMemberLevelID string           `json:"teamMemberLevelId"`
	CreatedAt         string           `json:"createdAt"`
	UpdatedAt         string           `json:"updatedAt"`
}

// Repository defines the interface for organization config persistence
type Repository interface {
	Get() (*OrganizationConfig, error)
	Save(config *OrganizationConfig) error
}
