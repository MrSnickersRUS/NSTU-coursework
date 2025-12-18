package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
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

	// Seed superadmin if not exists (password: admin)
	var adminExists bool
	pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM users WHERE login = 'admin')").Scan(&adminExists)
	if !adminExists {
		// bcrypt hash for "admin"
		adminHash := "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
		_, err = pool.Exec(ctx, `
			INSERT INTO users (email, login, password_hash, role, email_verified)
			VALUES ('admin@netiwash.local', 'admin', $1, 'superadmin', true)
		`, adminHash)
		if err != nil {
			log.Printf("⚠️ Failed to create admin: %v", err)
		} else {
			log.Println("🔐 ================================")
			log.Println("🔐 SUPERADMIN CREATED:")
			log.Println("🔐 Login: admin")
			log.Println("🔐 Password: admin")
			log.Println("🔐 ================================")
		}
	}

	return nil
}
