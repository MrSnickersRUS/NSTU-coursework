package models

import "time"

type PushSubscription struct {
	ID        int       `json:"id" db:"id"`
	UserID    int       `json:"user_id" db:"user_id"`
	Endpoint  string    `json:"endpoint" db:"endpoint"`
	P256dh    string    `json:"keys_p256dh" db:"p256dh"`
	Auth      string    `json:"keys_auth" db:"auth"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}
