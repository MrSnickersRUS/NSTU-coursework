package repository

import (
	"context"
	"fmt"

	"netiwash/internal/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

type MachineRepository struct {
	db *pgxpool.Pool
}

func NewMachineRepository(db *pgxpool.Pool) *MachineRepository {
	return &MachineRepository{db: db}
}

func (r *MachineRepository) GetAll(ctx context.Context) ([]models.Machine, error) {
	query := `SELECT id, name, type, status, is_active FROM machines WHERE is_active = true ORDER BY id`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query machines: %w", err)
	}
	defer rows.Close()

	var machines []models.Machine
	for rows.Next() {
		var m models.Machine
		if err := rows.Scan(&m.ID, &m.Name, &m.Type, &m.Status, &m.IsActive); err != nil {
			return nil, fmt.Errorf("failed to scan machine: %w", err)
		}
		machines = append(machines, m)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}

	return machines, nil
}

func (r *MachineRepository) UpdateStatus(ctx context.Context, id int, status string) error {
	query := `UPDATE machines SET status = $1 WHERE id = $2`

	result, err := r.db.Exec(ctx, query, status, id)
	if err != nil {
		return fmt.Errorf("failed to update machine status: %w", err)
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("machine not found")
	}

	return nil
}
