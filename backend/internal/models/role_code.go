package models

import "time"

type RoleCode struct {
	ID        uint      `gorm:"primaryKey"`
	CreatedAt time.Time
	UpdatedAt time.Time

	Role Role   `gorm:"type:varchar(20);uniqueIndex;not null"`
	Code string `gorm:"type:varchar(10);uniqueIndex;not null"`
}
