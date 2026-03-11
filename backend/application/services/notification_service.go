package services

import (
	"context"

	"github.com/agopalakrishnan/teams360/backend/domain/healthcheck"
	"github.com/agopalakrishnan/teams360/backend/domain/organization"
	"github.com/agopalakrishnan/teams360/backend/domain/team"
	"github.com/agopalakrishnan/teams360/backend/domain/user"
	"github.com/agopalakrishnan/teams360/backend/infrastructure/email"
	"github.com/agopalakrishnan/teams360/backend/pkg/logger"
)

// NotificationService orchestrates email notifications for survey submissions.
type NotificationService struct {
	smtp     *email.SMTPEmailService // nil when SMTP is not configured
	teamRepo team.Repository
	userRepo user.Repository
	orgRepo  organization.Repository
}

// NewNotificationService creates a new notification service.
// smtp may be nil (email disabled).
func NewNotificationService(
	smtp *email.SMTPEmailService,
	teamRepo team.Repository,
	userRepo user.Repository,
	orgRepo organization.Repository,
) *NotificationService {
	return &NotificationService{
		smtp:     smtp,
		teamRepo: teamRepo,
		userRepo: userRepo,
		orgRepo:  orgRepo,
	}
}

// SendIndividualSurveyEmail sends a copy of the survey responses to the user's email.
// Errors are logged but never returned (fire-and-forget).
func (n *NotificationService) SendIndividualSurveyEmail(ctx context.Context, session *healthcheck.HealthCheckSession) {
	log := logger.Get()

	if n.smtp == nil {
		log.Debug("SMTP not configured, skipping individual survey email")
		return
	}

	// Look up user
	usr, err := n.userRepo.FindByID(ctx, session.UserID)
	if err != nil {
		log.WithField("user_id", session.UserID).Warn("notification: failed to find user for individual email")
		return
	}

	if usr.Email == "" {
		log.WithField("user_id", session.UserID).Debug("notification: user has no email, skipping")
		return
	}

	// Look up team name
	tm, err := n.teamRepo.FindByID(ctx, session.TeamID)
	if err != nil {
		log.WithField("team_id", session.TeamID).Warn("notification: failed to find team for individual email")
		return
	}

	// Build dimension results with names
	dimensions := n.buildDimensionResults(ctx, session.Responses)

	data := email.IndividualSurveyEmailData{
		UserName:         usr.Name,
		TeamName:         tm.Name,
		AssessmentPeriod: session.AssessmentPeriod,
		SurveyType:       session.SurveyType,
		Dimensions:       dimensions,
	}

	htmlBody := email.RenderIndividualSurveyEmail(data)
	subject := "Teams360 — Your Health Check Submission (" + tm.Name + ")"

	if err := n.smtp.SendHTML(ctx, usr.Email, subject, htmlBody); err != nil {
		log.WithError(err).WithField("to", usr.Email).Warn("notification: failed to send individual survey email")
	} else {
		log.WithField("to", usr.Email).Info("notification: individual survey email sent")
	}
}

// SendTeamSummaryEmail sends a post-workshop summary to the team's distribution list.
// Errors are logged but never returned (fire-and-forget).
func (n *NotificationService) SendTeamSummaryEmail(ctx context.Context, session *healthcheck.HealthCheckSession) {
	log := logger.Get()

	if n.smtp == nil {
		log.Debug("SMTP not configured, skipping team summary email")
		return
	}

	// Look up team
	tm, err := n.teamRepo.FindByID(ctx, session.TeamID)
	if err != nil {
		log.WithField("team_id", session.TeamID).Warn("notification: failed to find team for summary email")
		return
	}

	if tm.DistributionListEmail == nil || *tm.DistributionListEmail == "" {
		log.WithField("team_id", session.TeamID).Debug("notification: team has no DL email, skipping")
		return
	}

	// Look up submitter name
	submittedBy := session.UserID
	if usr, err := n.userRepo.FindByID(ctx, session.UserID); err == nil {
		submittedBy = usr.Name
	}

	// Build dimension results with names
	dimensions := n.buildDimensionResults(ctx, session.Responses)

	data := email.TeamSummaryEmailData{
		TeamName:         tm.Name,
		AssessmentPeriod: session.AssessmentPeriod,
		SubmittedBy:      submittedBy,
		Dimensions:       dimensions,
	}

	htmlBody := email.RenderTeamSummaryEmail(data)
	subject := "Teams360 — Post-Workshop Summary (" + tm.Name + ", " + session.AssessmentPeriod + ")"

	if err := n.smtp.SendHTML(ctx, *tm.DistributionListEmail, subject, htmlBody); err != nil {
		log.WithError(err).WithField("to", *tm.DistributionListEmail).Warn("notification: failed to send team summary email")
	} else {
		log.WithField("to", *tm.DistributionListEmail).Info("notification: team summary email sent")
	}
}

// buildDimensionResults maps session responses to DimensionResult with resolved names.
func (n *NotificationService) buildDimensionResults(ctx context.Context, responses []healthcheck.HealthCheckResponse) []email.DimensionResult {
	// Load dimension names
	dimMap := make(map[string]string)
	if dims, err := n.orgRepo.FindDimensions(ctx); err == nil {
		for _, d := range dims {
			dimMap[d.ID] = d.Name
		}
	}

	results := make([]email.DimensionResult, len(responses))
	for i, r := range responses {
		name := r.DimensionID
		if n, ok := dimMap[r.DimensionID]; ok {
			name = n
		}
		results[i] = email.DimensionResult{
			Name:    name,
			Score:   r.Score,
			Trend:   r.Trend,
			Comment: r.Comment,
		}
	}
	return results
}
