package user

// User represents a user in the system
// This is an aggregate root in DDD terms
type User struct {
	ID               string   `json:"id"`
	Username         string   `json:"username"`
	Name             string   `json:"name"`
	Email            string   `json:"email,omitempty"`
	HierarchyLevelID string   `json:"hierarchyLevelId,omitempty"`
	ReportsTo        string   `json:"reportsTo,omitempty"`
	TeamIDs          []string `json:"teamIds"`
	IsAdmin          bool     `json:"isAdmin,omitempty"`
}

// Repository defines the interface for user persistence
type Repository interface {
	FindByID(id string) (*User, error)
	FindByUsername(username string) (*User, error)
	FindAll() ([]*User, error)
	Save(user *User) error
	Delete(id string) error
}
