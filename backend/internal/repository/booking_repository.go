package repository

import (
	"context"
	"fmt"
	"time"

	"netiwash/internal/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

type BookingRepository struct {
	db *pgxpool.Pool
}

func NewBookingRepository(db *pgxpool.Pool) *BookingRepository {
	return &BookingRepository{db: db}
}

func (r *BookingRepository) Create(ctx context.Context, b *models.Booking) error {
	query := `
		INSERT INTO bookings (user_id, machine_id, start_time, end_time, status)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at
	`
	err := r.db.QueryRow(ctx, query, b.UserID, b.MachineID, b.StartTime, b.EndTime, b.Status).Scan(&b.ID, &b.CreatedAt)
	if err != nil {
		return fmt.Errorf("failed to create booking: %w", err)
	}
	return nil
}

func (r *BookingRepository) GetByUserID(ctx context.Context, userID int) ([]models.Booking, error) {
	query := `
		SELECT id, user_id, machine_id, start_time, end_time, status, created_at
		FROM bookings
		WHERE user_id = $1
		ORDER BY start_time DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("repository query error: %w", err)
	}
	defer rows.Close()

	var bookings []models.Booking
	for rows.Next() {
		var b models.Booking
		if err := rows.Scan(&b.ID, &b.UserID, &b.MachineID, &b.StartTime, &b.EndTime, &b.Status, &b.CreatedAt); err != nil {
			return nil, fmt.Errorf("row scan error: %w", err)
		}
		bookings = append(bookings, b)
	}
	return bookings, nil
}

func (r *BookingRepository) GetAll(ctx context.Context) ([]models.Booking, error) {
	query := `
		SELECT id, user_id, machine_id, start_time, end_time, status, created_at
		FROM bookings
		ORDER BY start_time DESC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("repository query error: %w", err)
	}
	defer rows.Close()

	var bookings []models.Booking
	for rows.Next() {
		var b models.Booking
		if err := rows.Scan(&b.ID, &b.UserID, &b.MachineID, &b.StartTime, &b.EndTime, &b.Status, &b.CreatedAt); err != nil {
			return nil, fmt.Errorf("row scan error: %w", err)
		}
		bookings = append(bookings, b)
	}
	return bookings, nil
}

func (r *BookingRepository) Cancel(ctx context.Context, id int) error {
	// We can physically delete or just set status to cancelled.
	// Since the user can stick to "history," setting status is better, OR we can delete if it's in the future.
	// The prompt implies straightforward cancellation. Let's delete future ones for now, or just Delete to keep it simple as per earlier mock.
	// Actually, keeping history is better. Let's update status to 'cancelled' if we had that enum, otherwise DELETE.
	// Our model has Status field.
	// BUT, usually a Delete request implies removal.
	// Let's implement DELETE for now to match the "Cancel" button behavior of disappearing item (or simple removal).
	// If we update status, we need to handle that status in frontend.
	// Front behaves as if it's gone?
	// Let's DELETE for simplicity in V1, unless status is 'completed'.

	query := `DELETE FROM bookings WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}

func (r *BookingRepository) CheckAvailability(ctx context.Context, machineID int, start, end time.Time) (bool, error) {
	// Check if any ACTIVE booking overlaps
	// Overlap logic: (Start1 < End2) AND (End1 > Start2)
	query := `
		SELECT COUNT(*)
		FROM bookings
		WHERE machine_id = $1
		  AND status = 'active'
		  AND start_time < $3
		  AND end_time > $2
	`
	var count int
	err := r.db.QueryRow(ctx, query, machineID, start, end).Scan(&count)
	if err != nil {
		return false, err
	}
	return count == 0, nil
}

func (r *BookingRepository) CountActiveBookingsByUser(ctx context.Context, userID int) (int, error) {
	query := `SELECT COUNT(*) FROM bookings WHERE user_id = $1 AND status = 'active'`
	var count int
	err := r.db.QueryRow(ctx, query, userID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count active bookings: %w", err)
	}
	return count, nil
}

func (r *BookingRepository) GetByID(ctx context.Context, id int) (*models.Booking, error) {
	query := `
		SELECT id, user_id, machine_id, start_time, end_time, status, created_at
		FROM bookings
		WHERE id = $1
	`
	var b models.Booking
	err := r.db.QueryRow(ctx, query, id).Scan(&b.ID, &b.UserID, &b.MachineID, &b.StartTime, &b.EndTime, &b.Status, &b.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("booking not found: %w", err)
	}
	return &b, nil
}

func (r *BookingRepository) UpdateStatus(ctx context.Context, id int, status string) error {
	query := `UPDATE bookings SET status = $1 WHERE id = $2`
	_, err := r.db.Exec(ctx, query, status, id)
	return err
}
