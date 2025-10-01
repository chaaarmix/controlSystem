package main

import (
	"log"
	"os"

	"controlSystem/internal/handlers"
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

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{getEnv("FRONTEND_ORIGIN", "http://localhost:3000")},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	api := r.Group("/api")
	{
		api.POST("/register", handlers.RegisterHandler(db))
		api.POST("/login", handlers.LoginHandler(db))
		// ... сюда можно повесить защищённые маршруты
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
