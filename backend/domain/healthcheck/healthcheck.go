package healthcheck

// HealthDimension represents a dimension being assessed
type HealthDimension struct {
	ID              string  `json:"id"`
	Name            string  `json:"name"`
	Description     string  `json:"description"`
	GoodDescription string  `json:"goodDescription"`
	BadDescription  string  `json:"badDescription"`
	IsActive        bool    `json:"isActive,omitempty"`
	Weight          float64 `json:"weight,omitempty"`
}

// HealthCheckResponse represents a single dimension response
type HealthCheckResponse struct {
	DimensionID string `json:"dimensionId"`
	Score       int    `json:"score"` // 1 = red, 2 = yellow, 3 = green
	Trend       string `json:"trend"` // improving, stable, declining
	Comment     string `json:"comment,omitempty"`
}

// HealthCheckSession represents a completed health check
// This is an aggregate root in DDD terms
type HealthCheckSession struct {
	ID               string                `json:"id"`
	TeamID           string                `json:"teamId"`
	UserID           string                `json:"userId"`
	Date             string                `json:"date"`
	AssessmentPeriod string                `json:"assessmentPeriod,omitempty"`
	Responses        []HealthCheckResponse `json:"responses"`
	Completed        bool                  `json:"completed"`
}

// Repository defines the interface for health check persistence
type Repository interface {
	FindByID(id string) (*HealthCheckSession, error)
	FindByTeamID(teamID string) ([]*HealthCheckSession, error)
	FindByUserID(userID string) ([]*HealthCheckSession, error)
	FindByAssessmentPeriod(period string) ([]*HealthCheckSession, error)
	Save(session *HealthCheckSession) error
	Delete(id string) error
}
