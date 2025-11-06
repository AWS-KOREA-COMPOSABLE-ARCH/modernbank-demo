package handlers

import (
	"database/sql"
	// "encoding/base64"
	// "fmt"
	"log"
	"modernbank_user/models"
	"modernbank_user/utils"
	"net/http"
	"os"

	// "time"

	"github.com/gin-gonic/gin"
	// "github.com/golang-jwt/jwt/v4"
	"github.com/joho/godotenv"
)

type LoginRequest struct {
	UserID   string `json:"user_id"`
	Password string `json:"password"`
}

func init() {
	// Load only when .env file exists
	if _, err := os.Stat(".env"); err == nil {
		if loadErr := godotenv.Load(); loadErr != nil {
			log.Fatal("Error loading .env file")
		}
	} else {
		log.Println(".env file not found, using system environment variables")
	}
}

func LoginHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {

		// Handle OPTIONS requests
		if c.Request.Method == "OPTIONS" {
			c.JSON(http.StatusOK, struct{}{})
			return
		}

		log.Println("LoginHandler: Started processing login request")

		var loginReq LoginRequest
		if err := c.ShouldBindJSON(&loginReq); err != nil {
			log.Printf("LoginHandler: Invalid request payload: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
			return
		}

		log.Printf("LoginHandler: Attempting to validate user: %s", loginReq.UserID)
		valid, err := models.ValidateUser(db, loginReq.UserID, loginReq.Password)
		if err != nil {
			log.Printf("LoginHandler: Error validating user: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
		if !valid {
			log.Printf("LoginHandler: Invalid credentials for user: %s", loginReq.UserID)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
			return
		}

		log.Printf("LoginHandler: User %s validated successfully, generating JWT", loginReq.UserID)
		token, err := utils.GenerateJWT(loginReq.UserID)
		if err != nil {
			log.Printf("LoginHandler: Failed to generate token: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
			return
		}

		log.Println("LoginHandler: Setting JWT token in cookie")
		utils.SetJWTCookie(c, token)

		log.Println("LoginHandler: Login successful")
		c.JSON(http.StatusOK, gin.H{"message": "Login successful"})
	}
}
