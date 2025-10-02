package handlers

import (
	"net/http"
	"strconv"

	"controlSystem/internal/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GET /api/projects
func ListProjectsHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var projects []models.Project
		if err := db.Preload("Manager").Preload("Customer").Preload("Tasks").Find(&projects).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "не удалось получить проекты"})
			return
		}
		c.JSON(http.StatusOK, projects)
	}
}

// GET /api/projects/:id
func GetProjectHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		idParam := c.Param("id")
		id, _ := strconv.Atoi(idParam)

		var project models.Project
		if err := db.Preload("Manager").Preload("Customer").Preload("Tasks").
			First(&project, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "проект не найден"})
			return
		}
		c.JSON(http.StatusOK, project)
	}
}

// POST /api/projects
func CreateProjectHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input struct {
			Name        string `json:"name"`
			Description string `json:"description"`
			ManagerID   uint   `json:"manager_id"`
			CustomerID  uint   `json:"customer_id"`
			Active      bool   `json:"active"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		project := models.Project{
			Name:        input.Name,
			Description: input.Description,
			ManagerID:   input.ManagerID,
			CustomerID:  input.CustomerID,
			Active:      input.Active,
		}
		if err := db.Create(&project).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "не удалось создать проект"})
			return
		}
		c.JSON(http.StatusOK, project)
	}
}
