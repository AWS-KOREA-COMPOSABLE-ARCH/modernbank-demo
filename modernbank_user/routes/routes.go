package routes

import (
	"fmt"
	"modernbank_user/db"
	"modernbank_user/handlers"
	"modernbank_user/middleware"
    // "github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	fmt.Println("setup route start...")
	// Add CORS
	fmt.Println("setting cors")
	r.Use(middleware.CORSMiddleware())
	// r.Use(cors.Default())
	fmt.Println("cors end")
    // Set base path to /modernbank/users
    baseRouter := r.Group("/modernbank/user")
    {
		baseRouter.OPTIONS("/", func(c *gin.Context) {
            c.Status(204) // Response for Preflight request
        })

        // Public routes
		// Login
        baseRouter.POST("/login", handlers.LoginHandler(db.DB))
		// Get user
		baseRouter.GET("/username/:user_id", handlers.GetUsername(db.DB))
		// Create user
        baseRouter.POST("", handlers.CreateUser(db.DB)) 

        // Protected routes
        protected := baseRouter.Group("/api")
        protected.Use(middleware.JWTAuthMiddleware())
        protected.PATCH("/:user_id/password", handlers.ChangePassword(db.DB))
    }

}
