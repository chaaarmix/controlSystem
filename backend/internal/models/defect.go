package models

import "time"

type Defect struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	Title       string `gorm:"not null" json:"title"`
	Description string `gorm:"type:text" json:"description"`

	ProjectID uint   `json:"project_id"`
	Project   Project `gorm:"foreignKey:ProjectID" json:"project"`

	InitiatorID uint `json:"initiator_id"`
	Initiator   User `gorm:"foreignKey:InitiatorID" json:"initiator"`

	Status string `gorm:"default:'Новая'" json:"status"` // Новая → В работе → На проверке → Закрыта/Отменена
    Files       []DefectFile `gorm:"foreignKey:DefectID" json:"files"`
	DueDate *time.Time `json:"due_date"`

	IsConverted       bool  `gorm:"default:false" json:"is_converted"`
	ConvertedToTaskID *uint `json:"converted_to_task_id"`
}

type DefectFile struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"created_at"`

	DefectID uint   `json:"defect_id"`
	FileName string `json:"file_name"`
	FilePath string `json:"file_path"`
}

type DefectHistory struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"created_at"`

	DefectID   uint   `json:"defect_id"`
	ActorID    uint   `json:"actor_id"`
	ActionType string `json:"action_type"`
	ActionText string `json:"action_text"`
}
