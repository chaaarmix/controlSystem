package models

import (
	"time"

)

type Role string

const (
	RoleAdmin    Role = "admin"
	RoleManager  Role = "manager"
	RoleEngineer Role = "engineer"
	RoleCustomer Role = "customer"
)

type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	FullName string `gorm:"not null" json:"full_name"`
	Email    string `gorm:"uniqueIndex;not null" json:"email"`
	Password string `gorm:"not null" json:"-"`
	Role     Role      `gorm:"type:varchar(20);not null" json:"role"`
}
