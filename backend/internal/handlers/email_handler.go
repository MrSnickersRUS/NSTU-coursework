package handlers

import (
	"net/http"

	"netiwash/internal/service"
	"netiwash/pkg/utils"

	"github.com/gin-gonic/gin"
)

type EmailHandler struct {
	authService  *service.AuthService
	emailService *utils.EmailService
}

func NewEmailHandler(authService *service.AuthService, emailService *utils.EmailService) *EmailHandler {
	return &EmailHandler{
		authService:  authService,
		emailService: emailService,
	}
}

func (h *EmailHandler) VerifyEmail(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Токен подтверждения обязателен"})
		return
	}

	if err := h.authService.VerifyEmail(c.Request.Context(), token); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Email успешно подтвержден"})
}

func (h *EmailHandler) ForgotPassword(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Укажите корректный email"})
		return
	}

	if err := h.authService.RequestPasswordReset(c.Request.Context(), req.Email); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "Если email существует, ссылка для сброса отправлена"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Письмо для сброса пароля отправлено"})
}

func (h *EmailHandler) ResetPassword(c *gin.Context) {
	var req struct {
		Token       string `json:"token" binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Токен и новый пароль обязательны"})
		return
	}

	if err := h.authService.ResetPassword(c.Request.Context(), req.Token, req.NewPassword); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Пароль успешно сброшен"})
}
