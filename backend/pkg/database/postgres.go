package database

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

func ConnectDB(connStr string) (*pgxpool.Pool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	config, err := pgxpool.ParseConfig(connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to parse config: %w", err)
	}

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, fmt.Errorf("unable to connect to database: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("unable to ping database: %w", err)
	}

	log.Println("✅ Connected to PostgreSQL")
	return pool, nil
}

// RunMigrations creates tables and seeds initial data
func RunMigrations(pool *pgxpool.Pool) error {
	ctx := context.Background()

	// Create tables
	schema := `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		email VARCHAR(255) UNIQUE NOT NULL,
		login VARCHAR(255) NOT NULL,
		password_hash VARCHAR(255) NOT NULL,
		role VARCHAR(50) DEFAULT 'user',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		email_verified BOOLEAN DEFAULT FALSE,
		verification_token VARCHAR(255),
		reset_token VARCHAR(255),
		reset_token_expiry TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS machines (
		id SERIAL PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		type VARCHAR(50) DEFAULT 'washing',
		status VARCHAR(50) DEFAULT 'free',
		is_active BOOLEAN DEFAULT TRUE
	);

	CREATE TABLE IF NOT EXISTS bookings (
		id SERIAL PRIMARY KEY,
		user_id INT REFERENCES users(id) ON DELETE CASCADE,
		machine_id INT REFERENCES machines(id) ON DELETE SET NULL,
		start_time TIMESTAMP NOT NULL,
		end_time TIMESTAMP NOT NULL,
		status VARCHAR(50) DEFAULT 'active',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
	CREATE INDEX IF NOT EXISTS idx_bookings_machine_id ON bookings(machine_id);
	CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
	CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

    CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, endpoint)
    );

    -- Try to add column if not exists (safe for re-run)
    DO $$ 
    BEGIN 
        BEGIN
            ALTER TABLE bookings ADD COLUMN push_sent BOOLEAN DEFAULT FALSE;
        EXCEPTION
            WHEN duplicate_column THEN RAISE NOTICE 'column push_sent already exists in bookings.';
        END;
    END $$;
	`

	_, err := pool.Exec(ctx, schema)
	if err != nil {
		return fmt.Errorf("failed to create schema: %w", err)
	}
	log.Println("✅ Database schema created/verified")

	// Seed machines if empty
	var machineCount int
	pool.QueryRow(ctx, "SELECT COUNT(*) FROM machines").Scan(&machineCount)
	if machineCount == 0 {
		_, err = pool.Exec(ctx, `
			INSERT INTO machines (name, type, status) VALUES 
			('Машинка #1', 'washing', 'free'),
			('Машинка #2', 'washing', 'free'),
			('Машинка #3', 'washing', 'busy'),
			('Сушилка #1', 'drying', 'free')
		`)
		if err != nil {
			log.Printf("⚠️ Failed to seed machines: %v", err)
		} else {
			log.Println("✅ Machines seeded")
		}
	}

	// Seed superadmin if not exists
	var adminExists bool
	err = pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM users WHERE role = 'superadmin')").Scan(&adminExists)
	if err != nil {
		log.Printf("⚠️ Failed to check admin: %v", err)
	}
	log.Printf("🔍 Superadmin check: exists=%v", adminExists)

	if !adminExists {
		// Generate secure random password
		randomLoginBytes := make([]byte, 16)
		randomPasswordBytes := make([]byte, 16)
		if _, err := rand.Read(randomLoginBytes); err != nil {
			return fmt.Errorf("failed to generate random password: %w", err)
		}
		if _, err := rand.Read(randomPasswordBytes); err != nil {
			return fmt.Errorf("failed to generate random password: %w", err)
		}
		adminLogin := "admin_" + hex.EncodeToString(randomLoginBytes)[:6]
		adminPassword := hex.EncodeToString(randomPasswordBytes)[:12] // 12 character password

		// Hash the password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(adminPassword), bcrypt.DefaultCost)
		if err != nil {
			return fmt.Errorf("failed to hash admin password: %w", err)
		}

		_, err = pool.Exec(ctx, `
			INSERT INTO users (email, login, password_hash, role, email_verified)
			VALUES ('admin@netiwash.local', $1, $2, 'superadmin', true)
		`, adminLogin, string(hashedPassword))
		if err != nil {
			log.Printf("⚠️ Failed to create admin: %v", err)
		} else {
			log.Println("🔐 ════════════════════════════════════")
			log.Println("🔐 СУПЕРАДМИН СОЗДАН (СОХРАНИТЬ!):")
			log.Printf("🔐 Login:    %s", adminLogin)
			log.Printf("🔐 Password: %s", adminPassword)
			log.Println("🔐 ════════════════════════════════════")
		}
	} else {
		log.Println("ℹ️ Superadmin already exists, skipping creation")
	}

	return nil
}
