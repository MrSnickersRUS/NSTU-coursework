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

// GET /api/bookings
func (h *BookingHandler) GetAll(c *gin.Context) {
	// Simple role check based on context set by Middleware (if present)
	// If middleware not running, it will default to false/0 which is safe-ish for list (user sees nothing or public?)
	// Actually current logic needs userID to filter "my bookings"
	// Let's assume Middleware runs. If not, we might panic on type assertion if we are strict.
	// For robustness:

	userIDVal, _ := c.Get("userID") // might be nil if public endpoint
	roleVal, _ := c.Get("role")

	userID, _ := userIDVal.(int)
	role, _ := roleVal.(string)

	isAdmin := (role == "admin" || role == "superadmin")

	// If filtered by ?all=true and is admin (handled by service or here?)
	// Service GetAll takes (ctx, isAdmin, userID).

	bookings, err := h.service.GetAll(c.Request.Context(), isAdmin, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Ensure we return [] not null
	if bookings == nil {
		bookings = []models.Booking{}
	}

	c.JSON(http.StatusOK, bookings)
}

// POST /api/bookings
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

	// Helper to parse "15:00" and "2023-12-16"
	// Frontend sends simple time string "HH:MM", date is likely just chosen date object
	// Wait, frontend Date is full ISO string or similar?
	// Let's check dashboard.js... it sends ISO string for date usually or constructed.
	// Assume simple concatenation for now or robust parsing.
	// Given previous "mock" used simple parsing.
	// Let's assume req.Date is "2025-12-16" (YYYY-MM-DD) and req.Time "15:00".

	// Combine
	fullTimeStr := req.Date + "T" + req.Time + ":00"

	// Parse with local timezone (Novosibirsk = UTC+7)
	// This ensures the time is interpreted in the user's timezone
	loc, err := time.LoadLocation("Asia/Novosibirsk")
	if err != nil {
		// Fallback to UTC+7 fixed offset if location not available
		loc = time.FixedZone("UTC+7", 7*60*60)
	}

	startTime, err := time.ParseInLocation("2006-01-02T15:04:05", fullTimeStr, loc)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date/time format"})
		return
	}

	// User ID from Token
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

// DELETE /api/bookings/:id
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

// CompleteBooking - Mark booking as completed early (Admin only)
func (h *BookingHandler) CompleteBooking(c *gin.Context) {
	id := c.Param("id")
	bookingID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid booking ID"})
		return
	}

	// Role check for admin
	roleVal, _ := c.Get("role")
	role, _ := roleVal.(string)
	isAdmin := (role == "admin" || role == "superadmin")
	if !isAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only administrators can complete bookings"})
		return
	}

	// Get booking to verify it exists and get details
	booking, err := h.service.GetByID(c.Request.Context(), bookingID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}

	// Update status to completed
	if err := h.service.CompleteBooking(c.Request.Context(), bookingID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// TODO: Trigger notification to user about early completion
	// This would be where you send push notification

	c.JSON(http.StatusOK, gin.H{
		"message":    "Booking completed successfully",
		"booking_id": bookingID,
		"machine_id": booking.MachineID,
	})
}
