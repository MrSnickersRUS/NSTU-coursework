package main

import (
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
	"netiwash/internal/config"
	"netiwash/internal/handlers"
	"netiwash/internal/middleware"
	"netiwash/internal/repository"
	"netiwash/internal/service"
	"netiwash/pkg/database"
	"netiwash/pkg/utils"
)

func main() {
	cfg := config.LoadConfig()
	dbPool, err := database.ConnectDB(cfg.DBUrl)
	if err != nil {
		log.Fatalf("Не удалось подключиться к бд: %v", err)
	}
	defer dbPool.Close()
	emailService := utils.NewEmailService()

	userRepo := repository.NewUserRepository(dbPool)
	authService := service.NewAuthService(userRepo, cfg.JWTSecret, emailService)
	authHandler := handlers.NewAuthHandler(authService)
	emailHandler := handlers.NewEmailHandler(authService, emailService)
	r := gin.Default()
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
			"db":     "connected",
		})
	})

	// Machine & Booking Dependencies
	machineRepo := repository.NewMachineRepository(dbPool)
	machineHandler := handlers.NewMachineHandler(machineRepo)

	bookingRepo := repository.NewBookingRepository(dbPool)
	bookingService := service.NewBookingService(bookingRepo)
	bookingHandler := handlers.NewBookingHandler(bookingService)

	// Middleware
	authMiddleware := middleware.NewAuthMiddleware(cfg.JWTSecret)

	// API Group
	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}

		api.GET("/machines", machineHandler.GetAll)

		// Protected Routes
		protected := api.Group("/")
		protected.Use(authMiddleware.RequireAuth)
		{
			protected.GET("/bookings", bookingHandler.GetAll)
			protected.POST("/bookings", bookingHandler.Create)
			protected.DELETE("/bookings/:id", bookingHandler.Cancel)
		}

		// Admin-only Routes
		admin := api.Group("/")
		admin.Use(authMiddleware.RequireAuth, authMiddleware.RequireRole("admin", "superadmin"))
		{
			admin.PUT("/machines/:id", machineHandler.UpdateStatus)
			admin.PATCH("/bookings/:id/complete", bookingHandler.CompleteBooking)
		}

		// Email verification & password reset (public routes)
		api.GET("/verify-email", emailHandler.VerifyEmail)
		api.POST("/forgot-password", emailHandler.ForgotPassword)
		api.POST("/reset-password", emailHandler.ResetPassword)

		// Aliases for root api access if needed matching frontend
		api.POST("/register", authHandler.Register)
		api.POST("/login", authHandler.Login)
	}

	log.Printf("🚀 Server running on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
