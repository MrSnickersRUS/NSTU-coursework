package service

import (
	"context"
	"fmt"
	"log"
	"netiwash/internal/models"
	"netiwash/internal/repository"
	"os"
	"time"

	"github.com/SherClockHolmes/webpush-go"
)

type NotificationService struct {
	repo        *repository.PushRepository
	bookingRepo *repository.BookingRepository
	vapidOne    string // Private key
	vapidTwo    string // Public key
	vapidEmail  string
}

func NewNotificationService(repo *repository.PushRepository, bookingRepo *repository.BookingRepository) *NotificationService {
	// Try to get keys from ENV, otherwise generate
	priv := os.Getenv("VAPID_PRIVATE_KEY")
	pub := os.Getenv("VAPID_PUBLIC_KEY")
	email := os.Getenv("VAPID_EMAIL")

	if email == "" {
		email = "mailto:admin@neti.ru"
	}

	if priv == "" || pub == "" {
		log.Println("⚠️ VAPID keys not found, generating new ones...")
		var err error
		priv, pub, err = webpush.GenerateVAPIDKeys()
		if err != nil {
			log.Fatalf("Failed to generate VAPID keys: %v", err)
		}
		log.Printf("🔑 NEW VAPID KEYS (Save to .env!):")
		log.Printf("VAPID_PUBLIC_KEY=%s", pub)
		log.Printf("VAPID_PRIVATE_KEY=%s", priv)
	}

	return &NotificationService{
		repo:       repo,
		vapidOne:   priv,
		vapidTwo:   pub,
		vapidEmail: email,
	}
}

func (s *NotificationService) GetPublicKey() string {
	return s.vapidTwo
}

func (s *NotificationService) Subscribe(ctx context.Context, userID int, endpoint, p256dh, auth string) error {
	sub := &models.PushSubscription{
		UserID:   userID,
		Endpoint: endpoint,
		P256dh:   p256dh,
		Auth:     auth,
	}
	return s.repo.CreateSubscription(ctx, sub)
}

func (s *NotificationService) SendNotification(ctx context.Context, userID int, message string) {
	subs, err := s.repo.GetSubscriptionsByUserID(ctx, userID)
	if err != nil {
		log.Printf("[PUSH] Error getting subscriptions for user %d: %v", userID, err)
		return
	}

	if len(subs) == 0 {
		return // No subscriptions
	}

	log.Printf("[PUSH] Sending to %d devices for user %d", len(subs), userID)

	for _, sub := range subs {
		s.sendToSubscription(sub, message)
	}
}

func (s *NotificationService) sendToSubscription(sub models.PushSubscription, message string) {
	sObj := &webpush.Subscription{
		Endpoint: sub.Endpoint,
		Keys: webpush.Keys{
			P256dh: sub.P256dh,
			Auth:   sub.Auth,
		},
	}

	// Send Notification
	resp, err := webpush.SendNotification([]byte(message), sObj, &webpush.Options{
		Subscriber:      s.vapidEmail,
		VAPIDPublicKey:  s.vapidTwo,
		VAPIDPrivateKey: s.vapidOne,
		TTL:             30,
	})
	if err != nil {
		log.Printf("[PUSH] Send error: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == 201 {
		// Success
	} else if resp.StatusCode == 410 {
		// Subscription gone, should delete (TODO)
		log.Printf("[PUSH] Subscription expired/gone")
	} else {
		log.Printf("[PUSH] Unexpected status code: %d", resp.StatusCode)
	}
}

func (s *NotificationService) StartWorker(ctx context.Context) {
	ticker := time.NewTicker(30 * time.Second)
	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				s.checkAndNotify(ctx)
			}
		}
	}()
	log.Println("🤖 [WORKER] Notification worker started")
}

func (s *NotificationService) checkAndNotify(ctx context.Context) {
	// 1. Find expired active bookings -> make them completed
	activeExpired, err := s.bookingRepo.GetExpiredActiveBookings(ctx)
	if err == nil {
		for _, b := range activeExpired {
			log.Printf("🤖 [WORKER] Auto-completing booking %d", b.ID)
			s.bookingRepo.UpdateStatus(ctx, b.ID, "completed")
			// Note: We don't mark push_sent here, so next step picks it up
			// Or we can send here immediately.
		}
	}

	// 2. Find completed but unnotified bookings -> send push
	unnotified, err := s.bookingRepo.GetCompletedUnnotifiedBookings(ctx)
	if err != nil {
		log.Printf("🤖 [WORKER] Error checking bookings: %v", err)
		return
	}

	for _, b := range unnotified {
		log.Printf("🤖 [WORKER] Sending push for booking %d", b.ID)

		msg := fmt.Sprintf("Стирка #%d завершена! Не забудьте забрать вещи.", b.ID)
		s.SendNotification(ctx, b.UserID, msg)

		s.bookingRepo.MarkPushSent(ctx, b.ID)
	}
}
