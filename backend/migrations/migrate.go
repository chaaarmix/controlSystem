package migrations

import (
	"log"
	"os"

	"controlSystem/internal/models"
	"controlSystem/internal/utils"

	"gorm.io/gorm"
)

func MigrateAndSeed(db *gorm.DB) {
	if err := db.AutoMigrate(&models.User{}, &models.RoleCode{}); err != nil {
		log.Fatal("automigrate error:", err)
	}

	// значения берем из переменных окружения, если не заданы — дефолты
	managerCode := getEnv("CODE_MANAGER", "111111")
	engineerCode := getEnv("CODE_ENGINEER", "222222")
	adminEmail := getEnv("ADMIN_EMAIL", "admin@example.com")
	adminPass := getEnv("ADMIN_PASSWORD", "Admin123!")

	seedRoleCode(db, models.RoleManager, managerCode)
	seedRoleCode(db, models.RoleEngineer, engineerCode)

	var admin models.User
	if err := db.Where("email = ?", adminEmail).First(&admin).Error; err != nil {

		hashed, err := utils.HashPassword(adminPass)
		if err != nil {
			log.Fatal("hash error", err)
		}
		admin = models.User{
			FullName: "Super Admin",
			Email:    adminEmail,
			Password: hashed,
			Role:     models.RoleAdmin,
		}
		if err := db.Create(&admin).Error; err != nil {
			log.Fatal("create admin error:", err)
		}
	}
    db.AutoMigrate(&models.User{}, &models.Project{}, &models.Task{})
}

func seedRoleCode(db *gorm.DB, role models.Role, code string) {
	var rc models.RoleCode
	if err := db.Where("role = ?", role).First(&rc).Error; err != nil {

		rc = models.RoleCode{Role: role, Code: code}
		if err := db.Create(&rc).Error; err != nil {
			log.Println("failed to create role code:", err)
		}
	}
}

func getEnv(key, def string) string {
	if v, ok := os.LookupEnv(key); ok {
		return v
	}
	return def
}
