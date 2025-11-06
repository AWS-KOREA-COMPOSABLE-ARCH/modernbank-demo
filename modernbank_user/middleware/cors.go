package middleware

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func CORSMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        origin := c.Request.Header.Get("Origin")
        
        // Print Origin address to console
        log.Printf("Received request from origin: %s", origin)

        // Allow all origins
        c.Header("Access-Control-Allow-Origin", origin)
        c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        // c.Header("Access-Control-Expose-Headers", "*")
        c.Header("Access-Control-Allow-Credentials", "true")

        // Handle Preflight requests
        if c.Request.Method == http.MethodOptions {
            log.Printf("Handling OPTIONS request from origin: %s", origin)
            c.AbortWithStatus(http.StatusNoContent)
            return
        }

        c.Next()
    }
}