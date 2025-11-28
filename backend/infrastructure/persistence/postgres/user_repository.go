package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/agopalakrishnan/teams360/backend/domain/user"
	"golang.org/x/crypto/bcrypt"
)

// UserRepository implements the user.Repository interface
type UserRepository struct {
	db *sql.DB
}

// NewUserRepository creates a new repository instance
func NewUserRepository(db *sql.DB) user.Repository {
	return &UserRepository{db: db}
}

// FindByID retrieves a user by ID
func (r *UserRepository) FindByID(ctx context.Context, id string) (*user.User, error) {
	var u user.User
	var email, hierarchyLevelID, reportsTo sql.NullString
	var createdAt, updatedAt sql.NullTime
	var passwordHash sql.NullString

	err := r.db.QueryRowContext(ctx, `
		SELECT id, username, full_name, email, hierarchy_level_id, reports_to,
		       password_hash, created_at, updated_at
		FROM users
		WHERE id = $1
	`, id).Scan(
		&u.ID,
		&u.Username,
		&u.Name,
		&email,
		&hierarchyLevelID,
		&reportsTo,
		&passwordHash,
		&createdAt,
		&updatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found: %s", id)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	// Handle NULL fields
	if email.Valid {
		u.Email = email.String
	}
	if hierarchyLevelID.Valid {
		u.HierarchyLevelID = hierarchyLevelID.String
	}
	if reportsTo.Valid {
		u.ReportsTo = &reportsTo.String
	}
	if passwordHash.Valid {
		u.PasswordHash = passwordHash.String
	}
	if createdAt.Valid {
		u.CreatedAt = createdAt.Time
	}
	if updatedAt.Valid {
		u.UpdatedAt = updatedAt.Time
	}

	// Fetch team IDs
	teamIDs, err := r.fetchTeamIDs(ctx, id)
	if err != nil {
		return nil, err
	}
	u.TeamIDs = teamIDs

	// Check if user is admin (username = 'admin')
	u.IsAdmin = u.Username == "admin"

	return &u, nil
}

// FindByUsername retrieves a user by username (used for authentication)
func (r *UserRepository) FindByUsername(ctx context.Context, username string) (*user.User, error) {
	var u user.User
	var email, hierarchyLevelID, reportsTo sql.NullString
	var createdAt, updatedAt sql.NullTime
	var passwordHash sql.NullString

	err := r.db.QueryRowContext(ctx, `
		SELECT id, username, full_name, email, hierarchy_level_id, reports_to,
		       password_hash, created_at, updated_at
		FROM users
		WHERE username = $1
	`, username).Scan(
		&u.ID,
		&u.Username,
		&u.Name,
		&email,
		&hierarchyLevelID,
		&reportsTo,
		&passwordHash,
		&createdAt,
		&updatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found: %s", username)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	// Handle NULL fields
	if email.Valid {
		u.Email = email.String
	}
	if hierarchyLevelID.Valid {
		u.HierarchyLevelID = hierarchyLevelID.String
	}
	if reportsTo.Valid {
		u.ReportsTo = &reportsTo.String
	}
	if passwordHash.Valid {
		u.PasswordHash = passwordHash.String
	}
	if createdAt.Valid {
		u.CreatedAt = createdAt.Time
	}
	if updatedAt.Valid {
		u.UpdatedAt = updatedAt.Time
	}

	// Fetch team IDs
	teamIDs, err := r.fetchTeamIDs(ctx, u.ID)
	if err != nil {
		return nil, err
	}
	u.TeamIDs = teamIDs

	// Check if user is admin
	u.IsAdmin = u.Username == "admin"

	return &u, nil
}

// FindByEmail retrieves a user by email
func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*user.User, error) {
	var u user.User
	var emailVal, hierarchyLevelID, reportsTo sql.NullString
	var createdAt, updatedAt sql.NullTime
	var passwordHash sql.NullString

	err := r.db.QueryRowContext(ctx, `
		SELECT id, username, full_name, email, hierarchy_level_id, reports_to,
		       password_hash, created_at, updated_at
		FROM users
		WHERE email = $1
	`, email).Scan(
		&u.ID,
		&u.Username,
		&u.Name,
		&emailVal,
		&hierarchyLevelID,
		&reportsTo,
		&passwordHash,
		&createdAt,
		&updatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found: %s", email)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	// Handle NULL fields
	if emailVal.Valid {
		u.Email = emailVal.String
	}
	if hierarchyLevelID.Valid {
		u.HierarchyLevelID = hierarchyLevelID.String
	}
	if reportsTo.Valid {
		u.ReportsTo = &reportsTo.String
	}
	if passwordHash.Valid {
		u.PasswordHash = passwordHash.String
	}
	if createdAt.Valid {
		u.CreatedAt = createdAt.Time
	}
	if updatedAt.Valid {
		u.UpdatedAt = updatedAt.Time
	}

	// Fetch team IDs
	teamIDs, err := r.fetchTeamIDs(ctx, u.ID)
	if err != nil {
		return nil, err
	}
	u.TeamIDs = teamIDs

	// Check if user is admin
	u.IsAdmin = u.Username == "admin"

	return &u, nil
}

// FindAll retrieves all users
func (r *UserRepository) FindAll(ctx context.Context) ([]*user.User, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, username, full_name, email, hierarchy_level_id, reports_to,
		       password_hash, created_at, updated_at
		FROM users
		ORDER BY username
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to query users: %w", err)
	}
	defer rows.Close()

	var users []*user.User

	for rows.Next() {
		var u user.User
		var email, hierarchyLevelID, reportsTo sql.NullString
		var createdAt, updatedAt sql.NullTime
		var passwordHash sql.NullString

		err := rows.Scan(
			&u.ID,
			&u.Username,
			&u.Name,
			&email,
			&hierarchyLevelID,
			&reportsTo,
			&passwordHash,
			&createdAt,
			&updatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user: %w", err)
		}

		// Handle NULL fields
		if email.Valid {
			u.Email = email.String
		}
		if hierarchyLevelID.Valid {
			u.HierarchyLevelID = hierarchyLevelID.String
		}
		if reportsTo.Valid {
			u.ReportsTo = &reportsTo.String
		}
		if passwordHash.Valid {
			u.PasswordHash = passwordHash.String
		}
		if createdAt.Valid {
			u.CreatedAt = createdAt.Time
		}
		if updatedAt.Valid {
			u.UpdatedAt = updatedAt.Time
		}

		// Fetch team IDs
		teamIDs, err := r.fetchTeamIDs(ctx, u.ID)
		if err != nil {
			return nil, err
		}
		u.TeamIDs = teamIDs

		// Check if user is admin
		u.IsAdmin = u.Username == "admin"

		users = append(users, &u)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}

	return users, nil
}

// FindByHierarchyLevel retrieves all users at a specific hierarchy level
func (r *UserRepository) FindByHierarchyLevel(ctx context.Context, levelID string) ([]*user.User, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, username, full_name, email, hierarchy_level_id, reports_to,
		       password_hash, created_at, updated_at
		FROM users
		WHERE hierarchy_level_id = $1
		ORDER BY username
	`, levelID)

	if err != nil {
		return nil, fmt.Errorf("failed to query users by hierarchy level: %w", err)
	}
	defer rows.Close()

	return r.scanUsers(ctx, rows)
}

// FindSubordinates recursively finds all users reporting to a given user
func (r *UserRepository) FindSubordinates(ctx context.Context, supervisorID string) ([]*user.User, error) {
	// Use recursive CTE to get all subordinates
	rows, err := r.db.QueryContext(ctx, `
		WITH RECURSIVE subordinates AS (
			-- Base case: direct reports
			SELECT id, username, full_name, email, hierarchy_level_id, reports_to,
			       password_hash, created_at, updated_at
			FROM users
			WHERE reports_to = $1

			UNION ALL

			-- Recursive case: reports of reports
			SELECT u.id, u.username, u.full_name, u.email, u.hierarchy_level_id, u.reports_to,
			       u.password_hash, u.created_at, u.updated_at
			FROM users u
			INNER JOIN subordinates s ON u.reports_to = s.id
		)
		SELECT id, username, full_name, email, hierarchy_level_id, reports_to,
		       password_hash, created_at, updated_at
		FROM subordinates
		ORDER BY username
	`, supervisorID)

	if err != nil {
		return nil, fmt.Errorf("failed to query subordinates: %w", err)
	}
	defer rows.Close()

	return r.scanUsers(ctx, rows)
}

// Save persists a new user
func (r *UserRepository) Save(ctx context.Context, u *user.User) error {
	// Begin transaction
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Convert empty strings to NULL for optional fields
	var email, hierarchyLevelID, reportsTo sql.NullString
	if u.Email != "" {
		email = sql.NullString{String: u.Email, Valid: true}
	}
	if u.HierarchyLevelID != "" {
		hierarchyLevelID = sql.NullString{String: u.HierarchyLevelID, Valid: true}
	}
	if u.ReportsTo != nil && *u.ReportsTo != "" {
		reportsTo = sql.NullString{String: *u.ReportsTo, Valid: true}
	}

	// Hash password if provided
	var passwordHash sql.NullString
	if u.PasswordHash != "" {
		// If the password hash is already a bcrypt hash (starts with $2a$), use it as-is
		// Otherwise, hash it
		if len(u.PasswordHash) > 4 && u.PasswordHash[:4] == "$2a$" {
			passwordHash = sql.NullString{String: u.PasswordHash, Valid: true}
		} else {
			hashed, err := bcrypt.GenerateFromPassword([]byte(u.PasswordHash), bcrypt.DefaultCost)
			if err != nil {
				return fmt.Errorf("failed to hash password: %w", err)
			}
			passwordHash = sql.NullString{String: string(hashed), Valid: true}
		}
	}

	// Set timestamps
	now := time.Now()
	if u.CreatedAt.IsZero() {
		u.CreatedAt = now
	}
	u.UpdatedAt = now

	// Insert user
	_, err = tx.ExecContext(ctx, `
		INSERT INTO users (id, username, full_name, email, hierarchy_level_id, reports_to, password_hash, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`, u.ID, u.Username, u.Name, email, hierarchyLevelID, reportsTo, passwordHash, u.CreatedAt, u.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to save user: %w", err)
	}

	// Insert team memberships
	for _, teamID := range u.TeamIDs {
		_, err = tx.ExecContext(ctx, `
			INSERT INTO team_members (team_id, user_id)
			VALUES ($1, $2)
		`, teamID, u.ID)
		if err != nil {
			return fmt.Errorf("failed to save team membership: %w", err)
		}
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// Update updates an existing user
func (r *UserRepository) Update(ctx context.Context, u *user.User) error {
	// Begin transaction
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Convert empty strings to NULL for optional fields
	var email, hierarchyLevelID, reportsTo sql.NullString
	if u.Email != "" {
		email = sql.NullString{String: u.Email, Valid: true}
	}
	if u.HierarchyLevelID != "" {
		hierarchyLevelID = sql.NullString{String: u.HierarchyLevelID, Valid: true}
	}
	if u.ReportsTo != nil && *u.ReportsTo != "" {
		reportsTo = sql.NullString{String: *u.ReportsTo, Valid: true}
	}

	// Update timestamp
	u.UpdatedAt = time.Now()

	// Update user (don't update password_hash here - use separate method)
	result, err := tx.ExecContext(ctx, `
		UPDATE users SET
			username = $1,
			full_name = $2,
			email = $3,
			hierarchy_level_id = $4,
			reports_to = $5,
			updated_at = $6
		WHERE id = $7
	`, u.Username, u.Name, email, hierarchyLevelID, reportsTo, u.UpdatedAt, u.ID)

	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("user not found: %s", u.ID)
	}

	// Update team memberships
	// Delete existing memberships
	_, err = tx.ExecContext(ctx, "DELETE FROM team_members WHERE user_id = $1", u.ID)
	if err != nil {
		return fmt.Errorf("failed to delete team memberships: %w", err)
	}

	// Insert new memberships
	for _, teamID := range u.TeamIDs {
		_, err = tx.ExecContext(ctx, `
			INSERT INTO team_members (team_id, user_id)
			VALUES ($1, $2)
		`, teamID, u.ID)
		if err != nil {
			return fmt.Errorf("failed to save team membership: %w", err)
		}
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// Delete removes a user
func (r *UserRepository) Delete(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, "DELETE FROM users WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("user not found: %s", id)
	}

	return nil
}

// FindTeamIDsForUser retrieves all team IDs for a user
func (r *UserRepository) FindTeamIDsForUser(ctx context.Context, userID string) ([]string, error) {
	return r.fetchTeamIDs(ctx, userID)
}

// FindTeamsWhereUserIsLead retrieves all team IDs where the user is a team lead
func (r *UserRepository) FindTeamsWhereUserIsLead(ctx context.Context, userID string) ([]string, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id
		FROM teams
		WHERE team_lead_id = $1
		ORDER BY id
	`, userID)

	if err != nil {
		return nil, fmt.Errorf("failed to query teams where user is lead: %w", err)
	}
	defer rows.Close()

	var teamIDs []string
	for rows.Next() {
		var teamID string
		if err := rows.Scan(&teamID); err != nil {
			return nil, fmt.Errorf("failed to scan team ID: %w", err)
		}
		teamIDs = append(teamIDs, teamID)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}

	// Return empty slice instead of nil if no teams
	if teamIDs == nil {
		teamIDs = []string{}
	}

	return teamIDs, nil
}

// fetchTeamIDs is a helper function to get team IDs for a user
func (r *UserRepository) fetchTeamIDs(ctx context.Context, userID string) ([]string, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT team_id
		FROM team_members
		WHERE user_id = $1
		ORDER BY team_id
	`, userID)

	if err != nil {
		return nil, fmt.Errorf("failed to query team memberships: %w", err)
	}
	defer rows.Close()

	var teamIDs []string
	for rows.Next() {
		var teamID string
		if err := rows.Scan(&teamID); err != nil {
			return nil, fmt.Errorf("failed to scan team ID: %w", err)
		}
		teamIDs = append(teamIDs, teamID)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}

	// Return empty slice instead of nil if no teams
	if teamIDs == nil {
		teamIDs = []string{}
	}

	return teamIDs, nil
}

// scanUsers is a helper function to scan query results into users
func (r *UserRepository) scanUsers(ctx context.Context, rows *sql.Rows) ([]*user.User, error) {
	var users []*user.User

	for rows.Next() {
		var u user.User
		var email, hierarchyLevelID, reportsTo sql.NullString
		var createdAt, updatedAt sql.NullTime
		var passwordHash sql.NullString

		err := rows.Scan(
			&u.ID,
			&u.Username,
			&u.Name,
			&email,
			&hierarchyLevelID,
			&reportsTo,
			&passwordHash,
			&createdAt,
			&updatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user: %w", err)
		}

		// Handle NULL fields
		if email.Valid {
			u.Email = email.String
		}
		if hierarchyLevelID.Valid {
			u.HierarchyLevelID = hierarchyLevelID.String
		}
		if reportsTo.Valid {
			u.ReportsTo = &reportsTo.String
		}
		if passwordHash.Valid {
			u.PasswordHash = passwordHash.String
		}
		if createdAt.Valid {
			u.CreatedAt = createdAt.Time
		}
		if updatedAt.Valid {
			u.UpdatedAt = updatedAt.Time
		}

		// Fetch team IDs
		teamIDs, err := r.fetchTeamIDs(ctx, u.ID)
		if err != nil {
			return nil, err
		}
		u.TeamIDs = teamIDs

		// Check if user is admin
		u.IsAdmin = u.Username == "admin"

		users = append(users, &u)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}

	return users, nil
}

// UpdatePassword updates a user's password hash
func (r *UserRepository) UpdatePassword(ctx context.Context, userID string, hashedPassword string) error {
	result, err := r.db.ExecContext(ctx, `
		UPDATE users
		SET password_hash = $1, updated_at = $2
		WHERE id = $3
	`, hashedPassword, time.Now(), userID)

	if err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("user not found: %s", userID)
	}

	return nil
}

// VerifyPassword checks if the provided password matches the user's password hash
// This is a helper method, not part of the repository interface
func (r *UserRepository) VerifyPassword(ctx context.Context, username, password string) (*user.User, error) {
	u, err := r.FindByUsername(ctx, username)
	if err != nil {
		return nil, err
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	if err != nil {
		return nil, fmt.Errorf("invalid password")
	}

	return u, nil
}
