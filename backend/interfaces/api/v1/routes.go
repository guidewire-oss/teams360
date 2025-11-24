package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// SetupRoutes configures all API routes for v1
func SetupRoutes(router *gin.Engine) {
	// Health check endpoint
	router.GET("/health", healthCheck)

	// API v1 group
	v1 := router.Group("/api/v1")
	{
		// User routes
		users := v1.Group("/users")
		{
			users.GET("", listUsers)
			users.GET("/:id", getUser)
			users.POST("", createUser)
			users.PUT("/:id", updateUser)
			users.DELETE("/:id", deleteUser)
		}

		// Team routes
		teams := v1.Group("/teams")
		{
			teams.GET("", listTeams)
			teams.GET("/:id", getTeam)
			teams.POST("", createTeam)
			teams.PUT("/:id", updateTeam)
			teams.DELETE("/:id", deleteTeam)
		}

		// Health check routes - Commented out as they are registered in SetupHealthCheckRoutesWithDB
		// healthChecks := v1.Group("/health-checks")
		// {
		// 	healthChecks.GET("", listHealthChecks)
		// 	healthChecks.GET("/:id", getHealthCheck)
		// 	healthChecks.POST("", submitHealthCheck)
		// }

		// Organization routes
		orgs := v1.Group("/organizations")
		{
			orgs.GET("/config", getOrgConfig)
			orgs.PUT("/config", updateOrgConfig)
		}
	}
}

// Placeholder handlers - to be implemented with TDD
func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"service": "team360-api",
		"version": "v1.0.0",
	})
}

func listUsers(c *gin.Context)  { c.JSON(http.StatusOK, gin.H{"message": "TODO: Implement with TDD"}) }
func getUser(c *gin.Context)    { c.JSON(http.StatusOK, gin.H{"message": "TODO: Implement with TDD"}) }
func createUser(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"message": "TODO: Implement with TDD"}) }
func updateUser(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"message": "TODO: Implement with TDD"}) }
func deleteUser(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"message": "TODO: Implement with TDD"}) }
func listTeams(c *gin.Context)  { c.JSON(http.StatusOK, gin.H{"message": "TODO: Implement with TDD"}) }
func getTeam(c *gin.Context)    { c.JSON(http.StatusOK, gin.H{"message": "TODO: Implement with TDD"}) }
func createTeam(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"message": "TODO: Implement with TDD"}) }
func updateTeam(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"message": "TODO: Implement with TDD"}) }
func deleteTeam(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"message": "TODO: Implement with TDD"}) }
func listHealthChecks(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "TODO: Implement with TDD"})
}
func getHealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "TODO: Implement with TDD"})
}
func submitHealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "TODO: Implement with TDD"})
}
func getOrgConfig(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "TODO: Implement with TDD"})
}
func updateOrgConfig(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "TODO: Implement with TDD"})
}
