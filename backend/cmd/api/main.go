package main

import (
	"database/sql"
	"os"

	"github.com/agopalakrishnan/teams360/backend/application/services"
	"github.com/agopalakrishnan/teams360/backend/application/trends"
	"github.com/agopalakrishnan/teams360/backend/infrastructure/persistence/postgres"
	"github.com/agopalakrishnan/teams360/backend/interfaces/api/middleware"
	"github.com/agopalakrishnan/teams360/backend/interfaces/api/v1"
	"github.com/agopalakrishnan/teams360/backend/pkg/logger"
	"github.com/gin-gonic/gin"
	"github.com/golang-migrate/migrate/v4"
	migratePostgres "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/lib/pq"
)

func main() {
	// Initialize logger
	logLevel := os.Getenv("LOG_LEVEL")
	if logLevel == "" {
		logLevel = "info"
	}
	prettyLogs := os.Getenv("LOG_PRETTY") == "true"

	logger.Init(logger.Config{
		Level:  logLevel,
		Pretty: prettyLogs,
	})

	log := logger.Get()

	// Set Gin mode based on environment
	mode := os.Getenv("GIN_MODE")
	if mode == "" {
		mode = gin.DebugMode
	}
	gin.SetMode(mode)

	// Connect to database
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		databaseURL = "postgres://postgres:postgres@localhost:5432/teams360?sslmode=disable"
	}

	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		log.WithError(err).Fatal("failed to connect to database")
	}
	defer db.Close()

	// Verify database connection - if database doesn't exist, create it
	if err := db.Ping(); err != nil {
		// Try to create the database if it doesn't exist
		log.Info("database doesn't exist, attempting to create it")
		adminDB, err := sql.Open("postgres", "postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable")
		if err != nil {
			log.WithError(err).Fatal("failed to connect to postgres database")
		}
		_, err = adminDB.Exec("CREATE DATABASE teams360")
		adminDB.Close()

		if err != nil {
			log.WithError(err).Fatal("failed to create database")
		}

		log.Info("database created successfully")

		// Reconnect to the new database
		db, err = sql.Open("postgres", databaseURL)
		if err != nil {
			log.WithError(err).Fatal("failed to connect to newly created database")
		}

		if err := db.Ping(); err != nil {
			log.WithError(err).Fatal("failed to ping newly created database")
		}
	}
	log.Info("database connection established")

	// Run migrations
	driver, err := migratePostgres.WithInstance(db, &migratePostgres.Config{})
	if err != nil {
		log.WithError(err).Fatal("failed to create migration driver")
	}

	migrationEngine, err := migrate.NewWithDatabaseInstance(
		"file://infrastructure/persistence/postgres/migrations",
		"postgres",
		driver,
	)
	if err != nil {
		log.WithError(err).Fatal("failed to create migration engine")
	}

	if err := migrationEngine.Up(); err != nil && err != migrate.ErrNoChange {
		log.WithError(err).Fatal("failed to run migrations")
	}
	log.Info("database migrations completed")

	// Initialize repositories
	healthCheckRepo := postgres.NewHealthCheckRepository(db)
	userRepo := postgres.NewUserRepository(db)
	teamRepo := postgres.NewTeamRepository(db)
	orgRepo := postgres.NewOrganizationRepository(db)

	// Initialize services
	trendsService := trends.NewService(db)
	jwtService := services.NewJWTService()

	// Initialize password reset service
	passwordResetRepo := postgres.NewPasswordResetRepository(db)
	mockEmailService := services.NewMockEmailService() // Use mock for now
	passwordResetService := services.NewPasswordResetService(passwordResetRepo, userRepo, mockEmailService)

	// Initialize router (use gin.New() instead of gin.Default() to disable default logger)
	router := gin.New()
	router.Use(gin.Recovery()) // Keep panic recovery

	// Add request ID and logging middleware (our zerolog-based logger replaces Gin's default)
	router.Use(middleware.RequestIDMiddleware())
	router.Use(middleware.RequestLoggerMiddleware())

	// Add security middleware
	router.Use(middleware.CORSMiddleware())
	router.Use(middleware.ContentTypeValidator())
	router.Use(middleware.MaxBodySizeMiddleware(10 * 1024 * 1024)) // 10MB max body size

	// Health check endpoint (used by tests and load balancers)
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy"})
	})

	// Setup API routes with repository injection
	v1.SetupHealthCheckRoutes(router, healthCheckRepo, orgRepo)
	v1.SetupAuthRoutes(router, userRepo, jwtService)
	v1.SetupManagerRoutes(router, healthCheckRepo, trendsService)
	v1.SetupTeamRoutes(router, healthCheckRepo, teamRepo)
	v1.SetupTeamDashboardRoutes(router, db)      // Still uses db (complex dashboard queries)
	v1.SetupUserRoutes(router, db)               // Still uses db (complex user queries)
	v1.SetupProtectedUserRoutes(router, db, jwtService) // Protected routes requiring JWT
	v1.SetupAdminRoutes(router, orgRepo, userRepo, teamRepo)
	v1.SetupPasswordResetRoutes(router, passwordResetService, userRepo)

	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.WithField("port", port).Info("starting Team360 API server")
	if err := router.Run(":" + port); err != nil {
		log.WithError(err).Fatal("failed to start server")
	}
}
