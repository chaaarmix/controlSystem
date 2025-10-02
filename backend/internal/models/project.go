package models

import (
	"time"

	"gorm.io/gorm"
)

type Project struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	Name        string `gorm:"not null" json:"name"`
	Description string `gorm:"type:text" json:"description"`

	ManagerID   uint `gorm:"not null" json:"manager_id"`
	Manager     User `gorm:"foreignKey:ManagerID" json:"manager"`

	CustomerID  uint `gorm:"not null" json:"customer_id"`
	Customer    User `gorm:"foreignKey:CustomerID" json:"customer"`

	Active      bool `gorm:"default:true" json:"active"`

	Tasks       []Task `gorm:"foreignKey:ProjectID" json:"tasks"`
}

