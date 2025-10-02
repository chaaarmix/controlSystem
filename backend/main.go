package main

import (
	"log"
	"os"

	"controlSystem/internal/handlers"
	"controlSystem/internal/middleware"
	"controlSystem/migrations"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	dsn := getEnv("DATABASE_DSN", "host=localhost user=postgres password=1234 dbname=control_system port=5432 sslmode=disable")
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("failed to connect db:", err)
	}

	migrations.MigrateAndSeed(db)

	r := gin.Default()
    	r.MaxMultipartMemory = 8 << 20

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{getEnv("FRONTEND_ORIGIN", "http://localhost:3000")},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	api := r.Group("/api")
    {
    r.GET("/uploads/:filename", func(c *gin.Context) {
        filename := c.Param("filename")
        path := "./uploads/" + filename

        // Проверяем, что файл существует
        if _, err := os.Stat(path); os.IsNotExist(err) {
            c.JSON(404, gin.H{"error": "File not found"})
            return
        }

        // Отдаём файл с заголовком для скачивания
        c.FileAttachment(path, filename)
    })
    	api.POST("/register", handlers.RegisterHandler(db))
    	api.POST("/login", handlers.LoginHandler(db))
        api.POST("/defects", handlers.CreateDefectHandler(db))

    	// проекты
    	api.GET("/projects", handlers.ListProjectsHandler(db))
    	api.GET("/projects/:id", handlers.GetProjectByID(db))
    	api.POST("/projects", handlers.CreateProjectHandler(db))

    	// дефекты
    	api.GET("/defects/for-manager", handlers.GetDefectsForManager(db))
    	api.POST("/defects/assign", handlers.AssignAndConvertHandler(db))
    	api.GET("/defects/:id/history", handlers.GetDefectHistory(db))
    	api.GET("/my-tasks", handlers.GetMyTasks(db))
// новый маршрут для загрузки файлов
        api.POST("/defects/test-upload", handlers.TestFileUploadHandler(db))
    	api.GET("/users", handlers.ListUsersHandler(db))

    }


	auth := r.Group("/api") // можно оставить "/api" для защищённых маршрутов
	auth.Use(middleware.AuthMiddleware())
	{
		auth.GET("/me", handlers.MeHandler(db))
	}

	port := getEnv("PORT", "8080")
	r.Run(":" + port)
}

func getEnv(key, def string) string {
	if v, ok := os.LookupEnv(key); ok {
		return v
	}
	return def
}
