package main

import (
	"context"
	"log"

	"netiwash/internal/config"
	"netiwash/pkg/database"
)

func main() {
	cfg := config.LoadConfig()
	db, err := database.ConnectDB(cfg.DBUrl)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	migration := `
		ALTER TABLE users 
		ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
		ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
		ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
		ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;

		CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
		CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);
	`

	_, err = db.Exec(context.Background(), migration)
	if err != nil {
		log.Fatalf("Migration failed: %v", err)
	}

	log.Println("✅ Migration completed successfully!")
}
