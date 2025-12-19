package models

import "time"

type User struct {
	ID                int        `json:"id" db:"id"`
	Email             string     `json:"email" db:"email"`
	Login             string     `json:"login" db:"login"`
	PasswordHash      string     `json:"-" db:"password_hash"`
	Role              string     `json:"role" db:"role"`
	EmailVerified     bool       `json:"email_verified" db:"email_verified"`
	VerificationToken string     `json:"-" db:"verification_token"`
	ResetToken        string     `json:"-" db:"reset_token"`
	ResetTokenExpiry  *time.Time `json:"-" db:"reset_token_expiry"`
	CreatedAt         time.Time  `json:"created_at" db:"created_at"`
}

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Login    string `json:"login" binding:"required,min=3"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Login    string `json:"login" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  struct {
		ID    int    `json:"id"`
		Email string `json:"email"`
		Name  string `json:"name"`
		Role  string `json:"role"`
	} `json:"user"`
}
