package handlers

import (
	"net/http"
	"strconv"

	"netiwash/internal/models"
	"netiwash/internal/repository"

	"github.com/gin-gonic/gin"
)

type MachineHandler struct {
	repo *repository.MachineRepository
}

func NewMachineHandler(repo *repository.MachineRepository) *MachineHandler {
	return &MachineHandler{repo: repo}
}

func (h *MachineHandler) GetAll(c *gin.Context) {
	machines, err := h.repo.GetAll(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Return empty array instead of null if no machines
	if machines == nil {
		machines = []models.Machine{} // Need import models if used types explicitly, but here we passed nil slice which marshals to null usually, better safe
	}

	c.JSON(http.StatusOK, machines)
}

// PUT /api/machines/:id
func (h *MachineHandler) UpdateStatus(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Status string `json:"status" binding:"required,oneof=free busy repair"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status. Must be: free, busy, or repair"})
		return
	}

	// Convert id to int
	machineID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid machine ID"})
		return
	}

	if err := h.repo.UpdateStatus(c.Request.Context(), machineID, req.Status); err != nil {
	c.JSON(http.StatusOK, gin.H{"message": "Machine status updated successfully"})
}
