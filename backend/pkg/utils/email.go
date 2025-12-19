package utils

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/smtp"
	"os"
	"strings"
)

type EmailService struct {
	smtpHost string
	smtpPort string
	from     string
	password string
	appURL   string
}

func NewEmailService() *EmailService {
	return &EmailService{
		smtpHost: getEnv("SMTP_HOST", "smtp.gmail.com"),
		smtpPort: getEnv("SMTP_PORT", "587"),
		from:     getEnv("SMTP_FROM", "noreply@netiwash.local"),
		password: getEnv("SMTP_PASSWORD", ""),
		appURL:   getEnv("APP_URL", "http://localhost:3000"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func (e *EmailService) SendEmail(to, subject, body string) error {
	if e.password == "" {
		fmt.Printf("📧 [EMAIL] To: %s\nSubject: %s\nBody:\n%s\n\n", to, subject, body)
		return nil
	}

	msg := []byte(fmt.Sprintf("From: %s\r\n"+
		"To: %s\r\n"+
		"Subject: %s\r\n"+
		"\r\n"+
		"%s\r\n", e.from, to, subject, body))

	auth := smtp.PlainAuth("", e.from, e.password, e.smtpHost)
	addr := e.smtpHost + ":" + e.smtpPort

	return smtp.SendMail(addr, auth, e.from, []string{to}, msg)
}

func (e *EmailService) SendVerificationEmail(to, token string) error {
	subject := "NETI WASH - Подтверждение email"

	verifyURL := fmt.Sprintf("%s/verify-email.html?token=%s", e.appURL, token)

	body := fmt.Sprintf(`Привет!

Спасибо за регистрацию в NETI WASH.

Пожалуйста, подтвердите ваш email, перейдя по ссылке:
%s

Если вы не регистрировались в NETI WASH, проигнорируйте это письмо.

С уважением,
Команда NETI WASH`, verifyURL)

	return e.SendEmail(to, subject, body)
}

func (e *EmailService) SendPasswordResetEmail(to, token string) error {
	subject := "NETI WASH - Восстановление пароля"

	resetURL := fmt.Sprintf("%s/reset-password.html?token=%s", e.appURL, token)

	body := fmt.Sprintf(`Привет!

Вы запросили восстановление пароля для вашего аккаунта NETI WASH.

Перейдите по ссылке для сброса пароля:
%s

Ссылка действительна в течение 1 часа.

Если вы не запрашивали восстановление пароля, проигнорируйте это письмо.

С уважением,
Команда NETI WASH`, resetURL)

	return e.SendEmail(to, subject, body)
}

func GenerateSecureToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func ValidateEmailFormat(email string) bool {
	if !strings.Contains(email, "@") {
		return false
	}
	parts := strings.Split(email, "@")
	return len(parts) == 2 && len(parts[0]) > 0 && len(parts[1]) > 3
}
