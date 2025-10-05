package models

import (
	"time"

	"gorm.io/gorm"
)

type Task struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Name        string `gorm:"not null" json:"name"`
	Description string `gorm:"type:text" json:"description"`

	Status    string `gorm:"default:'Open'" json:"status"` // Open/InProgress/Done/Cancelled
	ProjectID uint   `json:"project_id"`

	CreatorID uint `json:"creator_id"`
	Creator   User `gorm:"foreignKey:CreatorID" json:"creator"`

	AssigneeID *uint `json:"assignee_id"`
	Assignee   *User `gorm:"foreignKey:AssigneeID" json:"assignee"` // добавлено

	DueDate *time.Time `json:"due_date"`

	// связь с дефектом
	RelatedDefectID *uint   `json:"related_defect_id"`
	RelatedDefect   *Defect `gorm:"foreignKey:RelatedDefectID" json:"related_defect"`
}
