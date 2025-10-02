package handlers

import (
	"net/http"
	"strconv"
	"time"
	"fmt"
	"os"

	"controlSystem/internal/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func CreateDefectHandler(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        defect := models.Defect{
            Title:       c.PostForm("title"),
            Description: c.PostForm("description"),
        }

        projectID := c.PostForm("project_id")
        initiatorID := c.PostForm("initiator_id")
        fmt.Sscan(projectID, &defect.ProjectID)
        fmt.Sscan(initiatorID, &defect.InitiatorID)

        if err := db.Create(&defect).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось создать дефект"})
            return
        }

        // Возвращаем ID созданного дефекта
        c.JSON(http.StatusOK, defect)
    }
}



// GET /api/defects/for-manager
// GET /api/defects/for-manager
func GetDefectsForManager(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var defects []models.Defect
		if err := db.Preload("Initiator").Preload("Files").Find(&defects, "is_converted = false").Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		c.JSON(http.StatusOK, defects)
	}
}



type AssignRequest struct {
	DefectID   uint   `json:"defect_id" binding:"required"`
	AssigneeID uint   `json:"assignee_id" binding:"required"`
	DueDate    string `json:"due_date"`
	ActorID    uint   `json:"actor_id" binding:"required"`
}


// POST /api/defects/assign
func AssignAndConvertHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {


		var req AssignRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

        assigneeID := req.AssigneeID

		var defect models.Defect
		if err := db.First(&defect, req.DefectID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "defect not found"})
			return
		}

		var due *time.Time
		if req.DueDate != "" {
			if t, err := time.Parse(time.RFC3339, req.DueDate); err == nil {
				due = &t
			}
		}

		task := models.Task{
            	Name:            defect.Title,
            	Description:     defect.Description,
            	ProjectID:       defect.ProjectID,
            	CreatorID:       req.ActorID,
            	AssigneeID:      &assigneeID, // здесь уже можно присвоить указатель
            	DueDate:         due,
            	RelatedDefectID: &defect.ID,
            	Status:          "Open",
            }

		if err := db.Create(&task).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot create task"})
			return
		}

		defect.IsConverted = true
		defect.ConvertedToTaskID = &task.ID
		defect.Status = "В работе"
		db.Save(&defect)

		db.Create(&models.DefectHistory{
			DefectID:   defect.ID,
			ActorID:    uint(req.ActorID),
			ActionType: "assigned",
			ActionText: "Назначен исполнитель " + strconv.Itoa(int(req.AssigneeID)),
		})

		c.JSON(http.StatusOK, task)
	}
}

// GET /api/defects/:id/history
func GetDefectHistory(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		defectID := c.Param("id")
		var history []models.DefectHistory
		if err := db.Where("defect_id = ?", defectID).Order("created_at asc").Find(&history).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		c.JSON(http.StatusOK, history)
	}
}

// GET /api/my-tasks?assignee_id=123
func GetMyTasks(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		assigneeID := c.Query("assignee_id")
		var tasks []models.Task
		if err := db.Where("assignee_id = ?", assigneeID).Find(&tasks).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		c.JSON(http.StatusOK, tasks)
	}
}

// POST /api/defects/test-upload
func TestFileUploadHandler(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        // Проверка и создание папки uploads
        if _, err := os.Stat("./uploads"); os.IsNotExist(err) {
            os.MkdirAll("./uploads", os.ModePerm)
        }

        // Принимаем дефект ID из формы
        defectIDStr := c.PostForm("defect_id")
        var defectID uint
        fmt.Sscan(defectIDStr, &defectID)

        // Читаем файл
        file, err := c.FormFile("file")
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "Файл не передан"})
            return
        }

        path := "./uploads/" + file.Filename
        if err := c.SaveUploadedFile(file, path); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сохранения файла"})
            return
        }

        // Создаём запись в БД
        defFile := models.DefectFile{
            DefectID: defectID,
            FileName: file.Filename,
            FilePath: path,
        }

        if err := db.Create(&defFile).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка записи в БД"})
            return
        }

        c.JSON(http.StatusOK, gin.H{
            "message": "Файл успешно добавлен в БД",
            "file":    defFile,
        })
    }
}
