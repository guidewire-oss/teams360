package queries

import (
	"database/sql"
	"fmt"

	"github.com/agopalakrishnan/teams360/backend/domain/healthcheck"
)

// GetHealthDimensionsQuery represents the query to get all health dimensions
type GetHealthDimensionsQuery struct {
	OnlyActive bool
}

// GetHealthDimensionsHandler handles the query
type GetHealthDimensionsHandler struct {
	db *sql.DB
}

// NewGetHealthDimensionsHandler creates a new query handler
func NewGetHealthDimensionsHandler(db *sql.DB) *GetHealthDimensionsHandler {
	return &GetHealthDimensionsHandler{db: db}
}

// Handle executes the query
func (h *GetHealthDimensionsHandler) Handle(query GetHealthDimensionsQuery) ([]healthcheck.HealthDimension, error) {
	var queryStr string
	var args []interface{}

	if query.OnlyActive {
		queryStr = `
			SELECT id, name, description, good_description, bad_description, is_active, weight
			FROM health_dimensions
			WHERE is_active = true
			ORDER BY name
		`
	} else {
		queryStr = `
			SELECT id, name, description, good_description, bad_description, is_active, weight
			FROM health_dimensions
			ORDER BY name
		`
	}

	rows, err := h.db.Query(queryStr, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query dimensions: %w", err)
	}
	defer rows.Close()

	dimensions := []healthcheck.HealthDimension{}
	for rows.Next() {
		var dim healthcheck.HealthDimension
		err := rows.Scan(
			&dim.ID,
			&dim.Name,
			&dim.Description,
			&dim.GoodDescription,
			&dim.BadDescription,
			&dim.IsActive,
			&dim.Weight,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan dimension: %w", err)
		}
		dimensions = append(dimensions, dim)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating dimensions: %w", err)
	}

	return dimensions, nil
}
