package handlers

import (
	"net/http"
	"netiwash/internal/service"

	"github.com/gin-gonic/gin"
)

type NotificationHandler struct {
	service *service.NotificationService
}

func NewNotificationHandler(service *service.NotificationService) *NotificationHandler {
	return &NotificationHandler{service: service}
}

func (h *NotificationHandler) GetVAPIDKey(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"publicKey": h.service.GetPublicKey(),
	})
}

func (h *NotificationHandler) Subscribe(c *gin.Context) {
	var req struct {
		Endpoint string `json:"endpoint"`
		Keys     struct {
			P256dh string `json:"p256dh"`
			Auth   string `json:"auth"`
		} `json:"keys"`
	}

	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDVal.(int)

	err := h.service.Subscribe(c.Request.Context(), userID, req.Endpoint, req.Keys.P256dh, req.Keys.Auth)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"status": "subscribed"})
}
