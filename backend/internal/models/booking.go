package models

import "time"

type Booking struct {
	ID        int       `json:"id" db:"id"`
	UserID    int       `json:"user_id" db:"user_id"`
	MachineID int       `json:"machine_id" db:"machine_id"`
	StartTime time.Time `json:"start_time" db:"start_time"`
	EndTime   time.Time `json:"end_time" db:"end_time"`
	Status    string    `json:"status" db:"status"` // active, completed, cancelled
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}
