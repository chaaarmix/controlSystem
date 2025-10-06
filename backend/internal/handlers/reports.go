package handlers

import (
    "net/http"
    "strconv"
    "time"

    "github.com/gin-gonic/gin"
    "gorm.io/gorm"

    "controlSystem/internal/models"
)

type TaskReportItem struct {
    ID           uint       `json:"id"`
    ProjectName  string     `json:"project_name"`
    DefectName   string     `json:"defect_name"`
    TaskName     string     `json:"task_name"`
    Status       string     `json:"status"`
    AssigneeName string     `json:"assignee_name"`
    DueDate      *time.Time `json:"due_date,omitempty"`
    HistoryCount int        `json:"history_count"`
    LastUpdate   time.Time  `json:"last_update"`
}

func GetTaskReports(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        projectIDStr := c.Query("project_id")
        if projectIDStr == "" {
            c.JSON(http.StatusBadRequest, gin.H{"error": "project_id is required"})
            return
        }

        projectID, err := strconv.Atoi(projectIDStr)
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project_id"})
            return
        }

        var tasks []models.Task
        if err := db.Preload("RelatedDefect.Project").
            Preload("RelatedDefect.History").
            Preload("Assignee").
            Where("project_id = ?", projectID).
            Find(&tasks).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load tasks"})
            return
        }

        report := []TaskReportItem{}
        for _, t := range tasks {
            historyCount := 0
            lastUpdate := t.UpdatedAt

            if t.RelatedDefect != nil {
                historyCount = len(t.RelatedDefect.History)
                if len(t.RelatedDefect.History) > 0 {
                    lastUpdate = t.RelatedDefect.History[len(t.RelatedDefect.History)-1].CreatedAt
                }
            }

            report = append(report, TaskReportItem{
                ID:           t.ID,
                ProjectName:  safeProjectName(t),
                DefectName:   safeDefectTitle(t),
                TaskName:     t.Name,
                Status:       t.Status,
                AssigneeName: safeAssigneeName(t),
                DueDate:      t.DueDate,
                HistoryCount: historyCount,
                LastUpdate:   lastUpdate,
            })
        }

        c.JSON(http.StatusOK, report)
    }
}

func safeProjectName(t models.Task) string {
    if t.RelatedDefect != nil && t.RelatedDefect.Project.Name != "" {
        return t.RelatedDefect.Project.Name
    }
    return "-"
}

func safeDefectTitle(t models.Task) string {
    if t.RelatedDefect != nil && t.RelatedDefect.Title != "" {
        return t.RelatedDefect.Title
    }
    return "-"
}

func safeAssigneeName(t models.Task) string {
    if t.Assignee != nil {
        return t.Assignee.FullName
    }
    return "-"
}
