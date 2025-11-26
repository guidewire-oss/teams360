package main

import (
	"database/sql"
	"log"
	"os"

	"github.com/agopalakrishnan/teams360/backend/infrastructure/persistence/postgres"
	"github.com/agopalakrishnan/teams360/backend/interfaces/api/middleware"
	"github.com/agopalakrishnan/teams360/backend/interfaces/api/v1"
	"github.com/gin-gonic/gin"
	"github.com/golang-migrate/migrate/v4"
	migratePostgres "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/lib/pq"
)

func main() {
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
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Verify database connection - if database doesn't exist, create it
	if err := db.Ping(); err != nil {
		// Try to create the database if it doesn't exist
		log.Println("Database doesn't exist, attempting to create it...")
		adminDB, err := sql.Open("postgres", "postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable")
		if err != nil {
			log.Fatalf("Failed to connect to postgres database: %v", err)
		}
		_, err = adminDB.Exec("CREATE DATABASE teams360")
		adminDB.Close()

		if err != nil {
			log.Fatalf("Failed to create database: %v", err)
		}

		log.Println("Database created successfully")

		// Reconnect to the new database
		db, err = sql.Open("postgres", databaseURL)
		if err != nil {
			log.Fatalf("Failed to connect to newly created database: %v", err)
		}

		if err := db.Ping(); err != nil {
			log.Fatalf("Failed to ping newly created database: %v", err)
		}
	}
	log.Println("Successfully connected to database")

	// Run migrations
	driver, err := migratePostgres.WithInstance(db, &migratePostgres.Config{})
	if err != nil {
		log.Fatalf("Failed to create migration driver: %v", err)
	}

	migrationEngine, err := migrate.NewWithDatabaseInstance(
		"file://infrastructure/persistence/postgres/migrations",
		"postgres",
		driver,
	)
	if err != nil {
		log.Fatalf("Failed to create migration engine: %v", err)
	}

	if err := migrationEngine.Up(); err != nil && err != migrate.ErrNoChange {
		log.Fatalf("Failed to run migrations: %v", err)
	}
	log.Println("Database migrations completed successfully")

	// Initialize repository
	repository := postgres.NewHealthCheckRepository(db)

	// Initialize router
	router := gin.Default()

	// Add CORS middleware
	router.Use(middleware.CORSMiddleware())

	// Health check endpoint (used by tests and load balancers)
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy"})
	})

	// Setup API routes
	v1.SetupAuthRoutes(router, db)
	v1.SetupHealthCheckRoutesWithDB(router, db, repository)
	v1.SetupManagerRoutes(router, db)
	v1.SetupTeamRoutes(router, db, repository)
	v1.SetupTeamDashboardRoutes(router, db)
	v1.SetupUserRoutes(router, db)
	v1.SetupAdminRoutes(router, db)

	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting Team360 API server on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
