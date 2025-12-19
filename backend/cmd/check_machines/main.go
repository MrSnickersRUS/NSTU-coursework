package main

import (
	"context"
	"fmt"
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

	fmt.Println("=== MACHINES ===")
	rows, err := db.Query(context.Background(), "SELECT id, name, status FROM machines ORDER BY id")
	if err != nil {
		log.Fatal("Query failed:", err)
	}
	defer rows.Close()

	machineCount := 0
	for rows.Next() {
		var id int
		var name, status string
		if err := rows.Scan(&id, &name, &status); err != nil {
			log.Fatal("Scan failed:", err)
		}
		fmt.Printf("ID: %d, Name: %s, Status: %s\n", id, name, status)
		machineCount++
	}

	if machineCount == 0 {
		fmt.Println("⚠️  NO MACHINES FOUND! Creating initial machines...")

		machines := []struct{ name, status string }{
			{"Стиральная машина #1", "free"},
			{"Стиральная машина #2", "free"},
			{"Стиральная машина #3", "free"},
			{"Сушильная машина #1", "free"},
		}

		for _, m := range machines {
			_, err := db.Exec(context.Background(),
				"INSERT INTO machines (name, status) VALUES ($1, $2)",
				m.name, m.status)
			if err != nil {
				log.Printf("Failed to insert %s: %v", m.name, err)
			} else {
				fmt.Printf("✅ Created: %s\n", m.name)
			}
		}
	}

	fmt.Printf("\n✅ Total machines: %d\n", machineCount)
}
