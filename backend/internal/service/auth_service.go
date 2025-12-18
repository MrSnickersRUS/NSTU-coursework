package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"netiwash/internal/models"
	"netiwash/internal/repository"
	"netiwash/pkg/utils"
)

type AuthService struct {
	repo         *repository.UserRepository
	jwtSecret    string
	emailService *utils.EmailService
}

func NewAuthService(repo *repository.UserRepository, jwtSecret string, emailService *utils.EmailService) *AuthService {
	return &AuthService{
		repo:         repo,
		jwtSecret:    jwtSecret,
		emailService: emailService,
	}
}

// Register регистрирует нового пользователя и отправляет email подтверждения
func (s *AuthService) Register(ctx context.Context, req *models.RegisterRequest) (*models.AuthResponse, error) {
	if !utils.ValidateEmailFormat(req.Email) {
		return nil, errors.New("invalid email format")
	}

	existing, _ := s.repo.GetByEmailOrLogin(ctx, req.Email)
	if existing != nil {
		return nil, errors.New("user with this email/login already exists")
	}

	hashed, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	verificationToken, err := utils.GenerateSecureToken()
	if err != nil {
		return nil, err
	}
	user := &models.User{
		Email:             req.Email,
		Login:             req.Login,
		PasswordHash:      hashed,
		Role:              "user",
		EmailVerified:     false,
		VerificationToken: verificationToken,
	}

	err = s.repo.Create(ctx, user)
	if err != nil {
		return nil, err
	}

	go func() {
		verifyURL := fmt.Sprintf("http://localhost:8081/verify.html?token=%s", verificationToken)
		err := s.emailService.SendVerificationEmail(user.Email, verifyURL)
		if err != nil {
			fmt.Printf("Failed to send verification email: %v\n", err)
		}
	}()

	var response models.AuthResponse
	response.Token = ""
	response.User.ID = user.ID
	response.User.Email = user.Email
	response.User.Name = user.Login
	response.User.Role = user.Role

	return &response, nil
}

// Login аутентифицирует пользователя и возвращает JWT токен
func (s *AuthService) Login(ctx context.Context, req *models.LoginRequest) (*models.AuthResponse, error) {
	user, err := s.repo.GetByEmailOrLogin(ctx, req.Login)
	if err != nil || user == nil {
		return nil, errors.New("invalid email/login or password")
	}

	if !utils.CheckPassword(req.Password, user.PasswordHash) {
		return nil, errors.New("invalid email/login or password")
	}

	if !user.EmailVerified && user.Role != "superadmin" {
		return nil, errors.New("email not verified")
	}

	token, err := utils.GenerateToken(user.ID, user.Role, s.jwtSecret)
	if err != nil {
		return nil, err
	}

	var response models.AuthResponse
	response.Token = token
	response.User.ID = user.ID
	response.User.Email = user.Email
	response.User.Name = user.Login
	response.User.Role = user.Role

	return &response, nil
}

func (s *AuthService) VerifyEmail(ctx context.Context, token string) error {
	return s.repo.VerifyEmailByToken(ctx, token)
}

func (s *AuthService) RequestPasswordReset(ctx context.Context, email string) error {
	user, err := s.repo.GetByEmail(ctx, email)
	if err != nil || user == nil {
		// Don't reveal if user exists (security)
		return nil
	}

	resetToken, err := utils.GenerateSecureToken()
	if err != nil {
		return err
	}

	expiry := time.Now().Add(1 * time.Hour)
	if err := s.repo.SetPasswordResetToken(ctx, user.ID, resetToken, expiry); err != nil {
		return err
	}

	// Send reset email (non-blocking)
	go func() {
		resetURL := fmt.Sprintf("http://localhost:8081/reset-password.html?token=%s", resetToken)
		err := s.emailService.SendPasswordResetEmail(user.Email, resetURL)
		if err != nil {
			fmt.Printf("Failed to send reset email: %v\n", err)
		}
	}()

	return nil
}

func (s *AuthService) ResetPassword(ctx context.Context, token, newPassword string) error {
	user, err := s.repo.GetByResetToken(ctx, token)
	if err != nil || user == nil {
		return errors.New("invalid or expired reset token")
	}

	if user.ResetTokenExpiry != nil && time.Now().After(*user.ResetTokenExpiry) {
		return errors.New("reset token expired")
	}

	hashed, err := utils.HashPassword(newPassword)
	if err != nil {
		return err
	}

	return s.repo.UpdatePasswordAndClearResetToken(ctx, user.ID, hashed)
}
