package handlers

import (
	"net/http"

	"controlSystem/internal/models"
	"gorm.io/gorm"

	"github.com/gin-gonic/gin"
)

func MeHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "нет данных пользователя"})
			return
		}

		var user models.User
		if err := db.First(&user, userID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "пользователь не найден"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"id":        user.ID,
			"full_name": user.FullName,
			"email":     user.Email,
			"role":      user.Role,
		})
	}
}
