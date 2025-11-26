package v1

import (
	"database/sql"
	"net/http"

	"github.com/agopalakrishnan/teams360/backend/interfaces/dto"
	"github.com/gin-gonic/gin"
)

// TeamAdminHandler handles team-related admin HTTP requests
type TeamAdminHandler struct {
	db *sql.DB
}

// NewTeamAdminHandler creates a new TeamAdminHandler
func NewTeamAdminHandler(db *sql.DB) *TeamAdminHandler {
	return &TeamAdminHandler{db: db}
}

// ListTeams handles GET /api/v1/admin/teams
func (h *TeamAdminHandler) ListTeams(c *gin.Context) {
	query := `
		SELECT t.id, t.name, t.team_lead_id, u.full_name as team_lead_name,
		       t.cadence, t.created_at, t.updated_at,
		       (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
		FROM teams t
		LEFT JOIN users u ON t.team_lead_id = u.id
		ORDER BY t.name ASC
	`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to query teams",
			Message: err.Error(),
		})
		return
	}
	defer rows.Close()

	teams := []dto.AdminTeamDTO{}
	for rows.Next() {
		var team dto.AdminTeamDTO
		err := rows.Scan(
			&team.ID,
			&team.Name,
			&team.TeamLeadID,
			&team.TeamLeadName,
			&team.Cadence,
			&team.CreatedAt,
			&team.UpdatedAt,
			&team.MemberCount,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
				Error:   "Failed to parse team",
				Message: err.Error(),
			})
			return
		}
		teams = append(teams, team)
	}

	c.JSON(http.StatusOK, dto.TeamsResponse{
		Teams: teams,
		Total: len(teams),
	})
}

// CreateTeam handles POST /api/v1/admin/teams
func (h *TeamAdminHandler) CreateTeam(c *gin.Context) {
	var req dto.CreateTeamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "Invalid request body", Message: err.Error()})
		return
	}

	query := `
		INSERT INTO teams (id, name, team_lead_id, cadence)
		VALUES ($1, $2, $3, $4)
		RETURNING created_at, updated_at
	`

	var team dto.AdminTeamDTO
	team.ID = req.ID
	team.Name = req.Name
	team.TeamLeadID = req.TeamLeadID
	team.Cadence = req.Cadence
	team.MemberCount = 0

	err := h.db.QueryRow(
		query,
		req.ID,
		req.Name,
		req.TeamLeadID,
		req.Cadence,
	).Scan(&team.CreatedAt, &team.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to create team",
			Message: err.Error(),
		})
		return
	}

	// Get team lead name if assigned
	if req.TeamLeadID != nil {
		var teamLeadName string
		err = h.db.QueryRow("SELECT full_name FROM users WHERE id = $1", *req.TeamLeadID).Scan(&teamLeadName)
		if err == nil {
			team.TeamLeadName = &teamLeadName
		}
	}

	c.JSON(http.StatusCreated, team)
}

// UpdateTeam handles PUT /api/v1/admin/teams/:id
func (h *TeamAdminHandler) UpdateTeam(c *gin.Context) {
	id := c.Param("id")
	var req dto.UpdateTeamRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "Invalid request body", Message: err.Error()})
		return
	}

	// Check if team exists
	var exists bool
	err := h.db.QueryRow("SELECT EXISTS(SELECT 1 FROM teams WHERE id = $1)", id).Scan(&exists)
	if err != nil || !exists {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "Team not found"})
		return
	}

	query := `
		UPDATE teams
		SET name = COALESCE($1, name),
		    team_lead_id = COALESCE($2, team_lead_id),
		    cadence = COALESCE($3, cadence),
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = $4
		RETURNING id, name, team_lead_id, cadence, created_at, updated_at
	`

	var team dto.AdminTeamDTO
	err = h.db.QueryRow(
		query,
		req.Name,
		req.TeamLeadID,
		req.Cadence,
		id,
	).Scan(
		&team.ID,
		&team.Name,
		&team.TeamLeadID,
		&team.Cadence,
		&team.CreatedAt,
		&team.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to update team",
			Message: err.Error(),
		})
		return
	}

	// Get team lead name
	if team.TeamLeadID != nil {
		var teamLeadName string
		err = h.db.QueryRow("SELECT full_name FROM users WHERE id = $1", *team.TeamLeadID).Scan(&teamLeadName)
		if err == nil {
			team.TeamLeadName = &teamLeadName
		}
	}

	// Get member count
	err = h.db.QueryRow("SELECT COUNT(*) FROM team_members WHERE team_id = $1", team.ID).Scan(&team.MemberCount)

	c.JSON(http.StatusOK, team)
}

// DeleteTeam handles DELETE /api/v1/admin/teams/:id
func (h *TeamAdminHandler) DeleteTeam(c *gin.Context) {
	id := c.Param("id")

	result, err := h.db.Exec("DELETE FROM teams WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to delete team",
			Message: err.Error(),
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "Team not found"})
		return
	}

	dto.RespondMessage(c, http.StatusOK, "Team deleted successfully")
}
