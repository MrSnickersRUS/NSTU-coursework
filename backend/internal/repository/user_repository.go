package repository

import (
	"context"
	"fmt"
	"time"

	"netiwash/internal/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepository struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(ctx context.Context, user *models.User) error {
	query := `
		INSERT INTO users (email, login, password_hash, role, email_verified, verification_token) 
		VALUES ($1, $2, $3, $4, $5, $6) 
		RETURNING id, created_at`

	err := r.db.QueryRow(ctx, query, user.Email, user.Login, user.PasswordHash, user.Role, user.EmailVerified, user.VerificationToken).
		Scan(&user.ID, &user.CreatedAt)

	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}
	return nil
}

func (r *UserRepository) GetByEmailOrLogin(ctx context.Context, identifier string) (*models.User, error) {
	query := `SELECT id, email, login, password_hash, role, created_at FROM users WHERE email = $1 OR login = $1`

	var user models.User
	err := r.db.QueryRow(ctx, query, identifier).Scan(
		&user.ID, &user.Email, &user.Login, &user.PasswordHash, &user.Role, &user.CreatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return &user, nil
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `SELECT id, email, login, password_hash, role, created_at FROM users WHERE email = $1`

	var user models.User
	err := r.db.QueryRow(ctx, query, email).Scan(
		&user.ID, &user.Email, &user.Login, &user.PasswordHash, &user.Role, &user.CreatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return &user, nil
}

func (r *UserRepository) VerifyEmailByToken(ctx context.Context, token string) error {
	query := `UPDATE users SET email_verified = true, verification_token = NULL WHERE verification_token = $1`

	result, err := r.db.Exec(ctx, query, token)
	if err != nil {
		return fmt.Errorf("failed to verify email: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("invalid verification token")
	}

	return nil
}

func (r *UserRepository) SetPasswordResetToken(ctx context.Context, userID int, token string, expiry time.Time) error {
	query := `UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3`

	_, err := r.db.Exec(ctx, query, token, expiry, userID)
	if err != nil {
		return fmt.Errorf("failed to set reset token: %w", err)
	}

	return nil
}

func (r *UserRepository) GetByResetToken(ctx context.Context, token string) (*models.User, error) {
	query := `SELECT id, email, login, password_hash, role, reset_token_expiry, created_at FROM users WHERE reset_token = $1`

	var user models.User
	err := r.db.QueryRow(ctx, query, token).Scan(
		&user.ID, &user.Email, &user.Login, &user.PasswordHash, &user.Role, &user.ResetTokenExpiry, &user.CreatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get user by reset token: %w", err)
	}

	return &user, nil
}

func (r *UserRepository) UpdatePasswordAndClearResetToken(ctx context.Context, userID int, newPasswordHash string) error {
	query := `UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2`

	_, err := r.db.Exec(ctx, query, newPasswordHash, userID)
	if err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	return nil
}

func (r *UserRepository) CountSuperAdmins(ctx context.Context) (int, error) {
	query := `SELECT COUNT(*) FROM users WHERE role = 'superadmin'`
	var count int
	err := r.db.QueryRow(ctx, query).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count superadmins: %w", err)
	}
	return count, nil
}
