package service

import (
	"context"
	"errors"
	"time"

	"netiwash/internal/models"
	"netiwash/internal/repository"
)

type BookingService struct {
	repo *repository.BookingRepository
}

func NewBookingService(repo *repository.BookingRepository) *BookingService {
	return &BookingService{repo: repo}
}

func (s *BookingService) Create(ctx context.Context, userID, machineID int, startTime time.Time) (*models.Booking, error) {
	duration := time.Hour
	endTime := startTime.Add(duration)

	if startTime.Before(time.Now()) {
		if startTime.Add(1 * time.Minute).Before(time.Now()) {
			return nil, errors.New("cannot book in the past")
		}
	}

	activeCount, err := s.repo.CountActiveBookingsByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	if activeCount >= 5 {
		return nil, errors.New("максимум 5 активных бронирований")
	}

	available, err := s.repo.CheckAvailability(ctx, machineID, startTime, endTime)
	if err != nil {
		return nil, err
	}
	if !available {
		return nil, errors.New("time slot is busy")
	}

	booking := &models.Booking{
		UserID:    userID,
		MachineID: machineID,
		StartTime: startTime,
		EndTime:   endTime,
		Status:    "active",
	}

	if err := s.repo.Create(ctx, booking); err != nil {
		return nil, err
	}

	return booking, nil
}

func (s *BookingService) GetAll(ctx context.Context, isAdmin bool, userID int) ([]models.Booking, error) {
	if isAdmin {
		return s.repo.GetAll(ctx)
	}
	return s.repo.GetByUserID(ctx, userID)
}

func (s *BookingService) Cancel(ctx context.Context, id int, userID int, isAdmin bool) error {
	return s.repo.Cancel(ctx, id)
}

func (s *BookingService) GetByID(ctx context.Context, id int) (*models.Booking, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *BookingService) CompleteBooking(ctx context.Context, id int) error {
	return s.repo.UpdateStatus(ctx, id, "completed")
}
