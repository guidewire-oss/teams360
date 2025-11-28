package v1

import (
	"net/http"
	"strings"

	"github.com/agopalakrishnan/teams360/backend/domain/team"
	"github.com/agopalakrishnan/teams360/backend/interfaces/dto"
	"github.com/gin-gonic/gin"
)

// TeamAdminHandler handles team-related admin HTTP requests
type TeamAdminHandler struct {
	teamRepo team.Repository
}

// NewTeamAdminHandler creates a new TeamAdminHandler
func NewTeamAdminHandler(teamRepo team.Repository) *TeamAdminHandler {
	return &TeamAdminHandler{teamRepo: teamRepo}
}

// ListTeams handles GET /api/v1/admin/teams
func (h *TeamAdminHandler) ListTeams(c *gin.Context) {
	teams, err := h.teamRepo.FindAllWithDetails(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to query teams",
			Message: err.Error(),
		})
		return
	}

	// Convert to DTOs
	teamDTOs := make([]dto.AdminTeamDTO, len(teams))
	for i, tm := range teams {
		teamDTOs[i] = dto.AdminTeamDTO{
			ID:           tm.ID,
			Name:         tm.Name,
			TeamLeadID:   tm.TeamLeadID,
			TeamLeadName: tm.TeamLeadName,
			Cadence:      tm.Cadence,
			MemberCount:  tm.MemberCount,
			CreatedAt:    tm.CreatedAt,
			UpdatedAt:    tm.UpdatedAt,
		}
	}

	c.JSON(http.StatusOK, dto.TeamsResponse{
		Teams: teamDTOs,
		Total: len(teamDTOs),
	})
}

// CreateTeam handles POST /api/v1/admin/teams
func (h *TeamAdminHandler) CreateTeam(c *gin.Context) {
	var req dto.CreateTeamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "Invalid request body", Message: err.Error()})
		return
	}

	// Auto-generate ID from name if not provided
	teamID := req.ID
	if teamID == "" {
		teamID = generateTeamIDFromName(req.Name)
	}

	// Create team domain model
	tm := &team.Team{
		ID:         teamID,
		Name:       req.Name,
		TeamLeadID: req.TeamLeadID,
		Cadence:    req.Cadence,
		Members:    []team.TeamMember{},
	}

	// Save using repository
	if err := h.teamRepo.Save(c.Request.Context(), tm); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to create team",
			Message: err.Error(),
		})
		return
	}

	// Convert to DTO and return
	responseDTO := dto.AdminTeamDTO{
		ID:          tm.ID,
		Name:        tm.Name,
		TeamLeadID:  tm.TeamLeadID,
		Cadence:     tm.Cadence,
		MemberCount: 0,
		CreatedAt:   tm.CreatedAt,
		UpdatedAt:   tm.UpdatedAt,
	}

	c.JSON(http.StatusCreated, responseDTO)
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
	tm, err := h.teamRepo.FindByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "Team not found"})
		return
	}

	// Update fields if provided
	if req.Name != nil {
		tm.Name = *req.Name
	}
	if req.TeamLeadID != nil {
		tm.TeamLeadID = req.TeamLeadID
	}
	if req.Cadence != nil {
		tm.Cadence = *req.Cadence
	}

	// Update using repository
	if err := h.teamRepo.Update(c.Request.Context(), tm); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to update team",
			Message: err.Error(),
		})
		return
	}

	// Get member count
	memberCount, _ := h.teamRepo.CountTeamMembers(c.Request.Context(), tm.ID)

	// Convert to DTO and return
	responseDTO := dto.AdminTeamDTO{
		ID:           tm.ID,
		Name:         tm.Name,
		TeamLeadID:   tm.TeamLeadID,
		TeamLeadName: tm.TeamLeadName,
		Cadence:      tm.Cadence,
		MemberCount:  memberCount,
		CreatedAt:    tm.CreatedAt,
		UpdatedAt:    tm.UpdatedAt,
	}

	c.JSON(http.StatusOK, responseDTO)
}

// DeleteTeam handles DELETE /api/v1/admin/teams/:id
func (h *TeamAdminHandler) DeleteTeam(c *gin.Context) {
	id := c.Param("id")

	if err := h.teamRepo.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to delete team",
			Message: err.Error(),
		})
		return
	}

	dto.RespondMessage(c, http.StatusOK, "Team deleted successfully")
}

// generateTeamIDFromName creates a URL-safe ID from a team name
// e.g., "Test Team 123" -> "test-team-123"
func generateTeamIDFromName(name string) string {
	// Convert to lowercase and replace spaces with hyphens
	id := strings.ToLower(name)
	id = strings.ReplaceAll(id, " ", "-")
	// Remove any characters that aren't alphanumeric or hyphens
	var result strings.Builder
	for _, r := range id {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			result.WriteRune(r)
		}
	}
	return result.String()
}
