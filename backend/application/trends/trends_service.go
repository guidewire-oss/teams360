package trends

import (
	"database/sql"

	"github.com/agopalakrishnan/teams360/backend/interfaces/dto"
)

// Service provides trend data aggregation functionality
type Service struct {
	db *sql.DB
}

// NewService creates a new trends service
func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

// TrendResult holds the computed trend data
type TrendResult struct {
	Periods    []string
	Dimensions []dto.DimensionTrend
}

// GetTrendsForTeam returns trend data for a single team
func (s *Service) GetTrendsForTeam(teamID string) (*TrendResult, error) {
	// Get distinct assessment periods for this team
	periodsQuery := `
		SELECT DISTINCT assessment_period
		FROM health_check_sessions
		WHERE team_id = $1
			AND completed = true
			AND assessment_period IS NOT NULL
			AND assessment_period != ''
		ORDER BY assessment_period
	`

	periods, err := s.fetchPeriods(periodsQuery, teamID)
	if err != nil {
		return nil, err
	}

	if len(periods) == 0 {
		return &TrendResult{
			Periods:    []string{},
			Dimensions: []dto.DimensionTrend{},
		}, nil
	}

	// Get average scores per dimension per period
	trendsQuery := `
		SELECT
			hcr.dimension_id,
			hcs.assessment_period,
			AVG(hcr.score) as avg_score
		FROM health_check_responses hcr
		INNER JOIN health_check_sessions hcs ON hcr.session_id = hcs.id
		WHERE hcs.team_id = $1
			AND hcs.completed = true
			AND hcs.assessment_period IS NOT NULL
			AND hcs.assessment_period != ''
		GROUP BY hcr.dimension_id, hcs.assessment_period
		ORDER BY hcr.dimension_id, hcs.assessment_period
	`

	dimensions, err := s.fetchTrendData(trendsQuery, teamID, periods)
	if err != nil {
		return nil, err
	}

	return &TrendResult{
		Periods:    periods,
		Dimensions: dimensions,
	}, nil
}

// GetTrendsForManager returns aggregated trend data across all teams supervised by a manager
func (s *Service) GetTrendsForManager(managerID string) (*TrendResult, error) {
	// Get distinct assessment periods for supervised teams
	periodsQuery := `
		SELECT DISTINCT hcs.assessment_period
		FROM health_check_sessions hcs
		INNER JOIN teams t ON hcs.team_id = t.id
		INNER JOIN team_supervisors ts ON t.id = ts.team_id
		WHERE ts.user_id = $1
			AND hcs.completed = true
			AND hcs.assessment_period IS NOT NULL
			AND hcs.assessment_period != ''
		ORDER BY hcs.assessment_period
	`

	periods, err := s.fetchPeriods(periodsQuery, managerID)
	if err != nil {
		return nil, err
	}

	if len(periods) == 0 {
		return &TrendResult{
			Periods:    []string{},
			Dimensions: []dto.DimensionTrend{},
		}, nil
	}

	// Get aggregated average scores per dimension per period across all teams
	trendsQuery := `
		SELECT
			hcr.dimension_id,
			hcs.assessment_period,
			AVG(hcr.score) as avg_score
		FROM health_check_responses hcr
		INNER JOIN health_check_sessions hcs ON hcr.session_id = hcs.id
		INNER JOIN teams t ON hcs.team_id = t.id
		INNER JOIN team_supervisors ts ON t.id = ts.team_id
		WHERE ts.user_id = $1
			AND hcs.completed = true
			AND hcs.assessment_period IS NOT NULL
			AND hcs.assessment_period != ''
		GROUP BY hcr.dimension_id, hcs.assessment_period
		ORDER BY hcr.dimension_id, hcs.assessment_period
	`

	dimensions, err := s.fetchTrendData(trendsQuery, managerID, periods)
	if err != nil {
		return nil, err
	}

	return &TrendResult{
		Periods:    periods,
		Dimensions: dimensions,
	}, nil
}

// fetchPeriods executes a periods query and returns the distinct periods
func (s *Service) fetchPeriods(query string, id string) ([]string, error) {
	rows, err := s.db.Query(query, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	periods := []string{}
	for rows.Next() {
		var period string
		if err := rows.Scan(&period); err == nil {
			periods = append(periods, period)
		}
	}

	return periods, nil
}

// fetchTrendData executes a trends query and returns the dimension trends
func (s *Service) fetchTrendData(query string, id string, periods []string) ([]dto.DimensionTrend, error) {
	rows, err := s.db.Query(query, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// Build a map of dimension -> period -> score
	trendMap := make(map[string]map[string]float64)
	for rows.Next() {
		var dimensionID string
		var period string
		var avgScore float64

		if err := rows.Scan(&dimensionID, &period, &avgScore); err != nil {
			continue
		}

		if _, exists := trendMap[dimensionID]; !exists {
			trendMap[dimensionID] = make(map[string]float64)
		}
		trendMap[dimensionID][period] = avgScore
	}

	// Convert to ordered array format matching periods order
	dimensions := []dto.DimensionTrend{}
	for dimensionID, periodScores := range trendMap {
		scores := make([]float64, len(periods))
		for i, period := range periods {
			if score, exists := periodScores[period]; exists {
				scores[i] = score
			} else {
				scores[i] = 0 // No data for this period
			}
		}

		dimensions = append(dimensions, dto.DimensionTrend{
			DimensionID: dimensionID,
			Scores:      scores,
		})
	}

	return dimensions, nil
}
