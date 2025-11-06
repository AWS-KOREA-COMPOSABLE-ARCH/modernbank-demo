package main

import (
	"log"

	"modernbank_user/config"
	"modernbank_user/db"
	"modernbank_user/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize database
	db.InitDB(cfg.DatabaseURL)

	// Setup Gin router
	r := gin.Default()
	// Prevent automatic trailing slash removal
	r.RemoveExtraSlash = true
	// Disable automatic redirect
	r.RedirectTrailingSlash = false
	r.RedirectFixedPath = false

	// Add Swagger UI path
	//r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	// Print URL for every incoming request
	r.Use(func(c *gin.Context) {
		log.Printf("Incoming request: %s %s", c.Request.Method, c.Request.URL.Path)
		c.Next()
	})

	routes.SetupRoutes(r)

	// Start server
	log.Printf("Server is running on %s", cfg.ServerPort)
	if err := r.Run(cfg.ServerPort); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
