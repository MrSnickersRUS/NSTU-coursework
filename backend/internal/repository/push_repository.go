package repository

import (
	"context"
	"fmt"

	"netiwash/internal/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PushRepository struct {
	db *pgxpool.Pool
}

func NewPushRepository(db *pgxpool.Pool) *PushRepository {
	return &PushRepository{db: db}
}

func (r *PushRepository) CreateSubscription(ctx context.Context, sub *models.PushSubscription) error {
	query := `
		INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (user_id, endpoint) DO UPDATE 
		SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth
	`
	_, err := r.db.Exec(ctx, query, sub.UserID, sub.Endpoint, sub.P256dh, sub.Auth)
	if err != nil {
		return fmt.Errorf("failed to save subscription: %w", err)
	}
	return nil
}

func (r *PushRepository) GetSubscriptionsByUserID(ctx context.Context, userID int) ([]models.PushSubscription, error) {
	query := `SELECT id, user_id, endpoint, p256dh, auth, created_at FROM push_subscriptions WHERE user_id = $1`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get subscriptions: %w", err)
	}
	defer rows.Close()

	var subs []models.PushSubscription
	for rows.Next() {
		var s models.PushSubscription
		if err := rows.Scan(&s.ID, &s.UserID, &s.Endpoint, &s.P256dh, &s.Auth, &s.CreatedAt); err != nil {
			return nil, err
		}
		subs = append(subs, s)
	}
	return subs, nil
}
