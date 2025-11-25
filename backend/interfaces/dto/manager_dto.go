package dto

// TeamHealthSummary represents aggregated health data for a team
type TeamHealthSummary struct {
	TeamID          string             `json:"teamId"`
	TeamName        string             `json:"teamName"`
	OverallHealth   float64            `json:"overallHealth"`
	SubmissionCount int                `json:"submissionCount"`
	Dimensions      []DimensionSummary `json:"dimensions"`
}

// DimensionSummary represents aggregated health for a single dimension
type DimensionSummary struct {
	DimensionID   string  `json:"dimensionId"`
	AvgScore      float64 `json:"avgScore"`
	ResponseCount int     `json:"responseCount"`
}
