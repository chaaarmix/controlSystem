package handlers

import (
	"net/http"
	"strings"

	"controlSystem/internal/models"
	"controlSystem/internal/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type RegisterInput struct {
	FullName string `json:"full_name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Role     string `json:"role" binding:"required"`
	Code     string `json:"code"`
}

type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func RegisterHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var in RegisterInput
		if err := c.ShouldBindJSON(&in); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		role := models.Role(strings.ToLower(in.Role))
		if role == models.RoleAdmin {
			c.JSON(http.StatusForbidden, gin.H{"error": "registration with admin role is not allowed"})
			return
		}

		if role == models.RoleEngineer || role == models.RoleManager {
			if len(in.Code) != 6 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "code must be 6 digits"})
				return
			}
			var rc models.RoleCode
			if err := db.Where("role = ? AND code = ?", role, in.Code).First(&rc).Error; err != nil {
				c.JSON(http.StatusForbidden, gin.H{"error": "invalid code for role"})
				return
			}
		}

		var exists models.User
		if err := db.Where("email = ?", in.Email).First(&exists).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "email already registered"})
			return
		}

		hashed, err := utils.HashPassword(in.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "couldn't hash password"})
			return
		}

		user := models.User{
			FullName: in.FullName,
			Email:    in.Email,
			Password: hashed,
			Role:     role,
		}

		if err := db.Create(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error: " + err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "registered", "user_id": user.ID})
	}
}

func LoginHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var in LoginInput
		if err := c.ShouldBindJSON(&in); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var user models.User
		if err := db.Where("email = ?", in.Email).First(&user).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}

		if err := utils.CheckPasswordHash(user.Password, in.Password); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}

		token, err := utils.GenerateToken(user.ID, string(user.Role))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "couldn't create token"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"token": token,
			"user": gin.H{
				"id":        user.ID,
				"full_name": user.FullName,
				"email":     user.Email,
				"role":      user.Role,
			},
		})
	}
}


