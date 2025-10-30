package team

// Team represents a team in the organization
// This is an aggregate root in DDD terms
type Team struct {
	ID              string           `json:"id"`
	Name            string           `json:"name"`
	Cadence         string           `json:"cadence"` // weekly, biweekly, monthly, quarterly
	NextCheckDate   string           `json:"nextCheckDate"`
	Members         []string         `json:"members"`
	SupervisorChain []SupervisorLink `json:"supervisorChain"`
	Department      string           `json:"department,omitempty"`
	Division        string           `json:"division,omitempty"`
	Tags            []string         `json:"tags,omitempty"`
}

// SupervisorLink represents a link in the supervisor chain
type SupervisorLink struct {
	UserID  string `json:"userId"`
	LevelID string `json:"levelId"`
}

// Repository defines the interface for team persistence
type Repository interface {
	FindByID(id string) (*Team, error)
	FindAll() ([]*Team, error)
	FindByMemberID(memberID string) ([]*Team, error)
	FindBySupervisorID(supervisorID string) ([]*Team, error)
	Save(team *Team) error
	Delete(id string) error
}
