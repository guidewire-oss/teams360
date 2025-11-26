package dto

// SurveyHistoryResponse represents a user's survey history
type SurveyHistoryResponse struct {
	UserID         string                `json:"userId"`
	SurveyHistory  []SurveyHistoryEntry  `json:"surveyHistory"`
	TotalSessions  int                   `json:"totalSessions"`
}

// SurveyHistoryEntry represents a single health check session in user's history
type SurveyHistoryEntry struct {
	SessionID        string  `json:"sessionId"`
	TeamID           string  `json:"teamId"`
	TeamName         string  `json:"teamName"`
	Date             string  `json:"date"`
	AssessmentPeriod string  `json:"assessmentPeriod"`
	AvgScore         float64 `json:"avgScore"`
	ResponseCount    int     `json:"responseCount"`
	Completed        bool    `json:"completed"`
}
