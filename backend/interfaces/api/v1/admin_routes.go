package v1

import (
	"database/sql"

	"github.com/gin-gonic/gin"
)

// SetupAdminRoutes configures admin routes with database dependency injection
func SetupAdminRoutes(router *gin.Engine, db *sql.DB) {
	handler := NewAdminHandler(db)

	admin := router.Group("/api/v1/admin")
	{
		// Hierarchy Levels CRUD
		hierarchyLevels := admin.Group("/hierarchy-levels")
		{
			hierarchyLevels.GET("", handler.ListHierarchyLevels)
			hierarchyLevels.POST("", handler.CreateHierarchyLevel)
			hierarchyLevels.PUT("/:id", handler.UpdateHierarchyLevel)
			hierarchyLevels.PUT("/:id/position", handler.UpdateHierarchyPosition)
			hierarchyLevels.DELETE("/:id", handler.DeleteHierarchyLevel)
		}

		// Users CRUD
		users := admin.Group("/users")
		{
			users.GET("", handler.ListUsers)
			users.POST("", handler.CreateUser)
			users.PUT("/:id", handler.UpdateUser)
			users.DELETE("/:id", handler.DeleteUser)
		}

		// Teams CRUD
		teams := admin.Group("/teams")
		{
			teams.GET("", handler.ListTeams)
			teams.POST("", handler.CreateTeam)
			teams.PUT("/:id", handler.UpdateTeam)
			teams.DELETE("/:id", handler.DeleteTeam)
		}

		// Settings
		settings := admin.Group("/settings")
		{
			// Health Dimensions
			settings.GET("/dimensions", handler.GetDimensions)
			settings.PUT("/dimensions/:id", handler.UpdateDimension)

			// Notifications
			settings.GET("/notifications", handler.GetNotificationSettings)
			settings.PUT("/notifications", handler.UpdateNotificationSettings)

			// Retention Policy
			settings.GET("/retention", handler.GetRetentionPolicy)
			settings.PUT("/retention", handler.UpdateRetentionPolicy)
		}
	}
}
