package models

type Machine struct {
	ID       int    `json:"id" db:"id"`
	Name     string `json:"name" db:"name"`
	Type     string `json:"type" db:"type"`
	Status   string `json:"status" db:"status"`
	IsActive bool   `json:"is_active" db:"is_active"`
}
