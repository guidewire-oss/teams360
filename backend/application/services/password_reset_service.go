package services

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"regexp"
	"time"

	"github.com/agopalakrishnan/teams360/backend/domain/user"
	"golang.org/x/crypto/bcrypt"
)

// PasswordResetToken represents a password reset token
type PasswordResetToken struct {
	ID        string
	UserID    string
	TokenHash string
	ExpiresAt time.Time
	UsedAt    *time.Time
	CreatedAt time.Time
}

// PasswordResetRepository defines the interface for password reset token storage
type PasswordResetRepository interface {
	// Create stores a new password reset token
	Create(ctx context.Context, token *PasswordResetToken) error
	// FindByTokenHash finds a token by its hash (for validation)
	FindValidToken(ctx context.Context, tokenHash string) (*PasswordResetToken, error)
	// MarkAsUsed marks a token as used
	MarkAsUsed(ctx context.Context, tokenID string) error
	// DeleteExpiredTokens cleans up expired tokens
	DeleteExpiredTokens(ctx context.Context) error
}

// EmailService defines the interface for sending emails
type EmailService interface {
	SendPasswordResetEmail(ctx context.Context, email, resetToken string) error
}

// PasswordResetService handles password reset operations
type PasswordResetService struct {
	resetRepo    PasswordResetRepository
	userRepo     user.Repository
	emailService EmailService
	tokenExpiry  time.Duration
}

var (
	ErrInvalidResetToken = errors.New("invalid or expired reset token")
	ErrPasswordTooShort  = errors.New("password must be at least 8 characters")
	ErrInvalidEmail      = errors.New("invalid email format")
)

// NewPasswordResetService creates a new password reset service
func NewPasswordResetService(
	resetRepo PasswordResetRepository,
	userRepo user.Repository,
	emailService EmailService,
) *PasswordResetService {
	return &PasswordResetService{
		resetRepo:    resetRepo,
		userRepo:     userRepo,
		emailService: emailService,
		tokenExpiry:  1 * time.Hour, // Tokens expire in 1 hour
	}
}

// CreateResetToken generates a password reset token for the given email
// Returns the plain token (to be sent via email) or empty string if user not found
// Note: For security, always returns success even if user doesn't exist (prevents email enumeration)
func (s *PasswordResetService) CreateResetToken(email string) (string, error) {
	ctx := context.Background()

	// Find user by email
	usr, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		// User not found - return empty token but no error (security)
		return "", nil
	}

	// Generate a secure random token
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return "", fmt.Errorf("failed to generate token: %w", err)
	}
	plainToken := base64.URLEncoding.EncodeToString(tokenBytes)

	// Hash the token for storage
	tokenHash, err := bcrypt.GenerateFromPassword([]byte(plainToken), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("failed to hash token: %w", err)
	}

	// Generate unique ID
	idBytes := make([]byte, 16)
	rand.Read(idBytes)
	tokenID := base64.URLEncoding.EncodeToString(idBytes)

	// Create token record
	resetToken := &PasswordResetToken{
		ID:        tokenID,
		UserID:    usr.ID,
		TokenHash: string(tokenHash),
		ExpiresAt: time.Now().Add(s.tokenExpiry),
		CreatedAt: time.Now(),
	}

	// Save to database
	if err := s.resetRepo.Create(ctx, resetToken); err != nil {
		return "", fmt.Errorf("failed to save token: %w", err)
	}

	// Send email (async in production, but for testing we do it sync)
	if s.emailService != nil {
		if err := s.emailService.SendPasswordResetEmail(ctx, email, plainToken); err != nil {
			// Log error but don't fail - token is created
			fmt.Printf("Warning: Failed to send reset email: %v\n", err)
		}
	}

	return plainToken, nil
}

// ResetPassword validates the token and updates the user's password
func (s *PasswordResetService) ResetPassword(token, newPassword string) error {
	ctx := context.Background()

	// Validate password strength
	if len(newPassword) < 8 {
		return ErrPasswordTooShort
	}

	// Find all tokens for comparison (we need to check against bcrypt hashes)
	// In production, you might want to limit this or use a different approach
	resetToken, err := s.findValidTokenByPlainToken(ctx, token)
	if err != nil {
		return ErrInvalidResetToken
	}

	// Check if token is expired
	if time.Now().After(resetToken.ExpiresAt) {
		return ErrInvalidResetToken
	}

	// Check if token has already been used
	if resetToken.UsedAt != nil {
		return ErrInvalidResetToken
	}

	// Hash the new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Update user's password
	if err := s.userRepo.UpdatePassword(ctx, resetToken.UserID, string(hashedPassword)); err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	// Mark token as used
	if err := s.resetRepo.MarkAsUsed(ctx, resetToken.ID); err != nil {
		// Log error but don't fail - password is updated
		fmt.Printf("Warning: Failed to mark token as used: %v\n", err)
	}

	return nil
}

// findValidTokenByPlainToken finds a valid token by comparing plain token against stored hashes
func (s *PasswordResetService) findValidTokenByPlainToken(ctx context.Context, plainToken string) (*PasswordResetToken, error) {
	// This is a simplified approach - in production you might want to:
	// 1. Store a non-sensitive identifier alongside the hash
	// 2. Use a database-level hash comparison if supported
	return s.resetRepo.FindValidToken(ctx, plainToken)
}

// ValidateEmail validates an email format
func ValidateEmail(email string) error {
	// Simple email regex pattern
	pattern := `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
	matched, _ := regexp.MatchString(pattern, email)
	if !matched {
		return ErrInvalidEmail
	}
	return nil
}

// MockEmailService is a mock email service for testing
type MockEmailService struct {
	SentEmails []struct {
		Email string
		Token string
	}
}

// NewMockEmailService creates a new mock email service
func NewMockEmailService() *MockEmailService {
	return &MockEmailService{
		SentEmails: make([]struct {
			Email string
			Token string
		}, 0),
	}
}

// SendPasswordResetEmail mock implementation
func (m *MockEmailService) SendPasswordResetEmail(ctx context.Context, email, resetToken string) error {
	m.SentEmails = append(m.SentEmails, struct {
		Email string
		Token string
	}{Email: email, Token: resetToken})
	return nil
}
