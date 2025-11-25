package dto

// LoginRequest represents the login credentials
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse represents the successful login response
type LoginResponse struct {
	User UserDTO `json:"user"`
}

// UserDTO represents user data transfer object
type UserDTO struct {
	ID             string   `json:"id"`
	Username       string   `json:"username"`
	Email          string   `json:"email"`
	FullName       string   `json:"fullName"`
	HierarchyLevel string   `json:"hierarchyLevel"`
	TeamIds        []string `json:"teamIds"`
}
