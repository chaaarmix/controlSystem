package handlers

import (
	"net/http"
	"time"
	"fmt"
	"os"
	"log"

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
// POST /api/defects/assign
func AssignAndConvertHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req AssignRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		assigneeID := req.AssigneeID

		// Находим дефект
		var defect models.Defect
		if err := db.First(&defect, req.DefectID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "defect not found"})
			return
		}

		// Парсим дату выполнения
		var due *time.Time
		if req.DueDate != "" {
			t, err := time.Parse(time.RFC3339, req.DueDate)
			if err != nil {
				// Попробуем альтернативный формат без временной зоны
				t2, err2 := time.ParseInLocation("2006-01-02T15:04:05", req.DueDate, time.Local)
				if err2 != nil {
					c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid due_date format"})
					return
				}
				t = t2
			}
			due = &t
		}

		// Создаем задачу
		task := models.Task{
			Name:            defect.Title,
			Description:     defect.Description,
			ProjectID:       defect.ProjectID,
			CreatorID:       req.ActorID,
			AssigneeID:      &assigneeID,
			DueDate:         due,
			RelatedDefectID: &defect.ID,
			Status:          "Open",
		}

		if err := db.Create(&task).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot create task"})
			return
		}

		// Обновляем дефект
		defect.IsConverted = true
		defect.ConvertedToTaskID = &task.ID
		defect.Status = "В работе"
		if err := db.Save(&defect).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot update defect"})
			return
		}

		// Создаем запись в истории
		var actorName string
		var actor models.User
		if err := db.First(&actor, req.ActorID).Error; err == nil {
			actorName = actor.FullName
		} else {
			actorName = "неизвестный пользователь"
		}

		db.Create(&models.DefectHistory{
			DefectID:   defect.ID,
			ActorID:    req.ActorID,
			ActionType: "Назначение исполнителя",
			ActionText: fmt.Sprintf("Назначен исполнитель  (%s)", actorName),
		})

		c.JSON(http.StatusOK, task)
	}
}


// GET /api/defects/:id/history
func GetDefectHistory(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		defectID := c.Param("id")
		db.Preload("History.Actor") // Actor подгружается для каждой записи истории
		var history []models.DefectHistory
		if err := db.Where("defect_id = ?", defectID).Order("created_at asc").Find(&history).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		c.JSON(http.StatusOK, history)
	}
}

func GetMyTasks(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		assigneeID := c.Query("assignee_id")
		var tasks []models.Task

		if err := db.
            Preload("Creator").
            Preload("Assignee").
            Preload("RelatedDefect.Project").
            Preload("RelatedDefect.Initiator").
            Preload("RelatedDefect.Files").
            Preload("RelatedDefect.History").
            Preload("RelatedDefect.History.Actor").
            Where("assignee_id = ?", assigneeID).
            Find(&tasks).Error; err != nil {
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

func UpdateTaskStatus(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		taskID := c.Param("id")
		var req struct {
			Status  string `json:"status"`
			ActorID uint   `json:"actor_id"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var task models.Task
		if err := db.First(&task, taskID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
			return
		}

		oldStatus := task.Status
		task.Status = req.Status

		if err := db.Save(&task).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot update task status"})
			return
		}

		// Создание записи в истории дефекта
		if task.RelatedDefectID != nil {
			history := models.DefectHistory{
				DefectID:   *task.RelatedDefectID,
				ActorID:    req.ActorID,
				ActionType: "Изменение статуса задачи",
				ActionText: fmt.Sprintf("Статус задачи изменён с '%s' на '%s'", oldStatus, req.Status),
			}

			if err := db.Create(&history).Error; err != nil {
				log.Println("Failed to create defect history:", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot create defect history"})
				return
			}
		}

		// Подгружаем свежую историю, чтобы вернуть клиенту
		if task.RelatedDefectID != nil {
			if err := db.Preload("History.Actor").First(&task.RelatedDefect, *task.RelatedDefectID).Error; err != nil {
				log.Println("Failed to preload defect history:", err)
			}
		}

		c.JSON(http.StatusOK, task)
	}
}


// GET /api/tasks
func GetAllTasks(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        var tasks []models.Task
        if err := db.
            Preload("Creator").
            Preload("Assignee").
            Preload("RelatedDefect.Project").
            Preload("RelatedDefect.Initiator").
            Preload("RelatedDefect.Files").
            Preload("RelatedDefect.History").
            Preload("RelatedDefect.History.Actor").

            Find(&tasks).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
            return
        }
        c.JSON(http.StatusOK, tasks)
    }
}


type CommentRequest struct {
    DefectID uint   `json:"defect_id" binding:"required"`
    ActorID  uint   `json:"actor_id" binding:"required"`
    Comment  string `json:"comment" binding:"required"`
}

func AddDefectCommentHandler(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        var req CommentRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        history := models.DefectHistory{
            DefectID:   req.DefectID,
            ActorID:    req.ActorID,
            ActionType: "Комментарий",
            ActionText: req.Comment,
        }

        if err := db.Create(&history).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось сохранить комментарий"})
            return
        }

        c.JSON(http.StatusOK, history)
    }
}

func AddDefectCommentWithFileHandler(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        defectIDStr := c.PostForm("defect_id")
        actorIDStr := c.PostForm("actor_id")
        comment := c.PostForm("comment")

        var defectID, actorID uint
        fmt.Sscan(defectIDStr, &defectID)
        fmt.Sscan(actorIDStr, &actorID)

        // Сохраняем комментарий в истории
        history := models.DefectHistory{
            DefectID:   defectID,
            ActorID:    actorID,
            ActionType: "Комментарий",
            ActionText: comment,
        }
        if err := db.Create(&history).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot save comment"})
            return
        }

        var fileRecord *models.DefectFile
        file, err := c.FormFile("file")
        if err == nil {
            path := "./uploads/" + file.Filename
            if err := c.SaveUploadedFile(file, path); err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot save file"})
                return
            }
            df := models.DefectFile{
                DefectID: defectID,
                FileName: file.Filename,
                FilePath: path,
            }
            db.Create(&df)
            fileRecord = &df
        }

        c.JSON(http.StatusOK, gin.H{"historyItem": history, "file": fileRecord})
    }
}
