package handlers

import (
	"net/http"
	"strconv"
	"time"

	"netiwash/internal/models"
	"netiwash/internal/service"

	"github.com/gin-gonic/gin"
)

type BookingHandler struct {
	service *service.BookingService
}

func NewBookingHandler(service *service.BookingService) *BookingHandler {
	return &BookingHandler{service: service}
}

func (h *BookingHandler) GetAll(c *gin.Context) {
	userIDVal, _ := c.Get("userID")
	roleVal, _ := c.Get("role")

	userID, _ := userIDVal.(int)
	role, _ := roleVal.(string)

	isAdmin := (role == "admin" || role == "superadmin")

	bookings, err := h.service.GetAll(c.Request.Context(), isAdmin, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if bookings == nil {
		bookings = []models.Booking{}
	}

	c.JSON(http.StatusOK, bookings)
}

func (h *BookingHandler) Create(c *gin.Context) {
	var req struct {
		MachineID int    `json:"machine_id"`
		Date      string `json:"date"`
		Time      string `json:"time"`
	}

	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid data"})
		return
	}

	fullTimeStr := req.Date + "T" + req.Time + ":00"

	loc, err := time.LoadLocation("Asia/Novosibirsk")
	if err != nil {
		loc = time.FixedZone("UTC+7", 7*60*60)
	}

	startTime, err := time.ParseInLocation("2006-01-02T15:04:05", fullTimeStr, loc)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date/time format"})
		return
	}
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDVal.(int)

	booking, err := h.service.Create(c.Request.Context(), userID, req.MachineID, startTime)
	if err != nil {
		if err.Error() == "time slot is busy" {
			c.JSON(http.StatusConflict, gin.H{"error": "Время уже занято"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, booking)
}

func (h *BookingHandler) Cancel(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := strconv.Atoi(idStr)

	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDVal.(int)

	roleVal, _ := c.Get("role")
	role, _ := roleVal.(string)
	isAdmin := (role == "admin" || role == "superadmin")

	if err := h.service.Cancel(c.Request.Context(), id, userID, isAdmin); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Booking cancelled"})
}

func (h *BookingHandler) CompleteBooking(c *gin.Context) {
	id := c.Param("id")
	bookingID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid booking ID"})
		return
	}

	roleVal, _ := c.Get("role")
	role, _ := roleVal.(string)
	isAdmin := (role == "admin" || role == "superadmin")
	if !isAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only administrators can complete bookings"})
		return
	}

	booking, err := h.service.GetByID(c.Request.Context(), bookingID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}

	if err := h.service.CompleteBooking(c.Request.Context(), bookingID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Booking completed successfully",
		"booking_id": bookingID,
		"machine_id": booking.MachineID,
	})
}
