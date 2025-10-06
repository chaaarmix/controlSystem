package handlers

import (
	"net/http"

	"controlSystem/internal/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func ListUsersHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		role := c.Query("role")
		var users []models.User
		if role != "" {
			if err := db.Where("role = ?", role).Find(&users).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "не удалось получить пользователей"})
				return
			}
		} else {
			if err := db.Find(&users).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "не удалось получить пользователей"})
				return
			}
		}
		c.JSON(http.StatusOK, users)
	}
}
