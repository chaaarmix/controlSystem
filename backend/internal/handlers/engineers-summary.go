package handlers

import (
    "net/http"
    "controlSystem/internal/models"
    "gorm.io/gorm"
    "github.com/gin-gonic/gin"
    "sort"
)

type EngineerSummary struct {
    Name   string  `json:"name"`
    Total  int     `json:"total"`
    Closed int     `json:"closed"`
    Rate   float64 `json:"rate"`
}

func EngineersSummaryHandler(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        var tasks []models.Task
        if err := db.Preload("Assignee").Find(&tasks).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch tasks"})
            return
        }

        summaryMap := make(map[string]*EngineerSummary)

        for _, task := range tasks {
            name := "Без исполнителя"
            if task.Assignee != nil {
                name = task.Assignee.FullName
            }
            if _, exists := summaryMap[name]; !exists {
                summaryMap[name] = &EngineerSummary{
                    Name:   name,
                    Total:  0,
                    Closed: 0,
                }
            }
            summaryMap[name].Total++
            if task.Status == "Закрыта" {
                summaryMap[name].Closed++
            }
        }

        result := make([]EngineerSummary, 0, len(summaryMap))
        for _, v := range summaryMap {
            v.Rate = 0
            if v.Total > 0 {
                v.Rate = float64(v.Closed) / float64(v.Total)
            }
            result = append(result, *v)
        }

        sort.Slice(result, func(i, j int) bool {
            return result[i].Rate > result[j].Rate
        })

        c.JSON(http.StatusOK, result)
    }
}
