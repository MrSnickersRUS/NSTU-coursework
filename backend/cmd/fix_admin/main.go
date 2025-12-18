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

	hash := "$2b$12$5wRwS0OIS/RMT.cS8YTMoeNwMZFGxc9C3UmDJnYSLfEudgwmh0Ouy"

	_, err = db.Exec(context.Background(),
		"INSERT INTO users (email, login, password_hash, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO UPDATE SET password_hash = $3, role = $4",
		"admin@netiwash.local", "admin", hash, "superadmin")

	if err != nil {
		log.Fatal(err)
	}
	log.Println("✅ Admin password updated successfully")
}
