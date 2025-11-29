package v1_test

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/agopalakrishnan/teams360/backend/infrastructure/persistence/postgres"
	"github.com/agopalakrishnan/teams360/backend/interfaces/api/v1"
	"github.com/agopalakrishnan/teams360/backend/interfaces/dto"
	"github.com/gin-gonic/gin"
	"github.com/golang-migrate/migrate/v4"
	migratePostgres "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/lib/pq"
)

var testDB *sql.DB

// setupTestDB creates a test database connection and runs migrations
func setupTestDB(t *testing.T) *sql.DB {
	if testDB != nil {
		// Clean up test data before each test
		testDB.Exec("DELETE FROM team_members WHERE user_id LIKE 'test-%' OR team_id LIKE 'test-%'")
		testDB.Exec("DELETE FROM team_supervisors WHERE user_id LIKE 'test-%' OR team_id LIKE 'test-%'")
		testDB.Exec("DELETE FROM health_check_responses")
		testDB.Exec("DELETE FROM health_check_sessions WHERE user_id LIKE 'test-%'")
		testDB.Exec("DELETE FROM teams WHERE id LIKE 'test-%'")
		testDB.Exec("DELETE FROM users WHERE id LIKE 'test-%'")
		testDB.Exec("DELETE FROM hierarchy_levels WHERE id LIKE 'test-%'")
		testDB.Exec("DELETE FROM health_dimensions WHERE id LIKE 'test-%' OR id LIKE 'e2e-%' OR id LIKE 'dim-%'")
		return testDB
	}

	databaseURL := "postgres://postgres:postgres@localhost:5432/teams360_test?sslmode=disable"
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		t.Fatalf("Failed to connect to test database: %v", err)
	}

	if err := db.Ping(); err != nil {
		t.Fatalf("Failed to ping test database: %v", err)
	}

	// Run migrations
	driver, err := migratePostgres.WithInstance(db, &migratePostgres.Config{})
	if err != nil {
		t.Fatalf("Failed to create migration driver: %v", err)
	}

	migrationEngine, err := migrate.NewWithDatabaseInstance(
		"file://../../../infrastructure/persistence/postgres/migrations",
		"postgres",
		driver,
	)
	if err != nil {
		t.Fatalf("Failed to create migration engine: %v", err)
	}

	// Run migrations (don't drop first time, just apply any new ones)
	if err := migrationEngine.Up(); err != nil && err != migrate.ErrNoChange {
		t.Fatalf("Failed to run migrations: %v", err)
	}

	testDB = db
	return testDB
}

// setupRouter creates a test router with repository dependency injection
func setupRouter(db *sql.DB) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	// Create repositories
	orgRepo := postgres.NewOrganizationRepository(db)
	userRepo := postgres.NewUserRepository(db)
	teamRepo := postgres.NewTeamRepository(db)

	v1.SetupAdminRoutes(router, orgRepo, userRepo, teamRepo)
	return router
}

func TestListHierarchyLevels(t *testing.T) {
	db := setupTestDB(t)
	router := setupRouter(db)

	// Make GET request
	req := httptest.NewRequest("GET", "/api/v1/admin/hierarchy-levels", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Verify response
	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var response dto.HierarchyLevelsResponse
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	// Should have at least the seeded levels
	if len(response.Levels) < 5 {
		t.Errorf("Expected at least 5 hierarchy levels, got %d", len(response.Levels))
	}

	// Verify order
	for i := 1; i < len(response.Levels); i++ {
		if response.Levels[i-1].Position > response.Levels[i].Position {
			t.Error("Hierarchy levels not ordered by position")
		}
	}
}

func TestCreateHierarchyLevel(t *testing.T) {
	db := setupTestDB(t)
	router := setupRouter(db)

	// Create request
	reqBody := dto.CreateHierarchyLevelRequest{
		ID:   "test-level-1",
		Name: "Test Level",
		Permissions: dto.HierarchyPermissionsDTO{
			CanViewAllTeams:  true,
			CanEditTeams:     false,
			CanManageUsers:   false,
			CanTakeSurvey:    true,
			CanViewAnalytics: false,
		},
	}

	body, _ := json.Marshal(reqBody)
	req := httptest.NewRequest("POST", "/api/v1/admin/hierarchy-levels", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Verify response
	if w.Code != http.StatusCreated {
		t.Errorf("Expected status 201, got %d. Body: %s", w.Code, w.Body.String())
	}

	var response dto.HierarchyLevelDTO
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if response.ID != "test-level-1" {
		t.Errorf("Expected ID 'test-level-1', got '%s'", response.ID)
	}

	if response.Name != "Test Level" {
		t.Errorf("Expected name 'Test Level', got '%s'", response.Name)
	}

	// Cleanup
	db.Exec("DELETE FROM hierarchy_levels WHERE id = 'test-level-1'")
}

func TestListUsers(t *testing.T) {
	db := setupTestDB(t)
	router := setupRouter(db)

	// Make GET request
	req := httptest.NewRequest("GET", "/api/v1/admin/users", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Verify response
	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var response dto.UsersResponse
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	// Should have seeded demo users
	if len(response.Users) == 0 {
		t.Error("Expected at least some users")
	}

	if response.Total != len(response.Users) {
		t.Errorf("Total count mismatch: total=%d, users=%d", response.Total, len(response.Users))
	}
}

func TestCreateUser(t *testing.T) {
	db := setupTestDB(t)
	router := setupRouter(db)

	// Create request
	reqBody := dto.CreateUserRequest{
		ID:             "test-user-1",
		Username:       "testuser",
		Email:          "test@example.com",
		FullName:       "Test User",
		Password:       "password123",
		HierarchyLevel: "level-5",
		ReportsTo:      nil,
	}

	body, _ := json.Marshal(reqBody)
	req := httptest.NewRequest("POST", "/api/v1/admin/users", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Verify response
	if w.Code != http.StatusCreated {
		t.Errorf("Expected status 201, got %d. Body: %s", w.Code, w.Body.String())
	}

	var response dto.AdminUserDTO
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if response.Username != "testuser" {
		t.Errorf("Expected username 'testuser', got '%s'", response.Username)
	}

	// Cleanup
	db.Exec("DELETE FROM users WHERE id = 'test-user-1'")
}

func TestListTeams(t *testing.T) {
	db := setupTestDB(t)
	router := setupRouter(db)

	// Make GET request
	req := httptest.NewRequest("GET", "/api/v1/admin/teams", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Verify response
	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d. Response: %s", w.Code, w.Body.String())
	}

	var response dto.TeamsResponse
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	// Should have seeded demo teams
	if len(response.Teams) == 0 {
		t.Error("Expected at least some teams")
	}

	if response.Total != len(response.Teams) {
		t.Errorf("Total count mismatch: total=%d, teams=%d", response.Total, len(response.Teams))
	}

	// Verify team has cadence
	for _, team := range response.Teams {
		if team.Cadence == "" {
			t.Errorf("Team %s has empty cadence", team.ID)
		}
	}
}

func TestGetDimensions(t *testing.T) {
	db := setupTestDB(t)
	router := setupRouter(db)

	// Make GET request
	req := httptest.NewRequest("GET", "/api/v1/admin/settings/dimensions", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Verify response
	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var response dto.DimensionsResponse
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	// Should have 11 seeded dimensions
	if len(response.Dimensions) != 11 {
		t.Errorf("Expected 11 dimensions, got %d", len(response.Dimensions))
	}

	// Verify dimensions have required fields
	for _, dim := range response.Dimensions {
		if dim.ID == "" || dim.Name == "" {
			t.Error("Dimension missing required fields")
		}
		if dim.Weight <= 0 {
			t.Errorf("Dimension %s has invalid weight: %f", dim.ID, dim.Weight)
		}
	}
}

func TestUpdateDimension(t *testing.T) {
	db := setupTestDB(t)
	router := setupRouter(db)

	// Update request
	isActive := false
	weight := 2.5
	reqBody := dto.UpdateDimensionRequest{
		IsActive: &isActive,
		Weight:   &weight,
	}

	body, _ := json.Marshal(reqBody)
	req := httptest.NewRequest("PUT", "/api/v1/admin/settings/dimensions/mission", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Verify response
	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d. Body: %s", w.Code, w.Body.String())
	}

	var response dto.HealthDimensionDTO
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if response.IsActive != false {
		t.Errorf("Expected IsActive to be false, got %v", response.IsActive)
	}

	if response.Weight != 2.5 {
		t.Errorf("Expected weight 2.5, got %f", response.Weight)
	}

	// Restore original values
	isActive = true
	weight = 1.0
	reqBody = dto.UpdateDimensionRequest{IsActive: &isActive, Weight: &weight}
	body, _ = json.Marshal(reqBody)
	req = httptest.NewRequest("PUT", "/api/v1/admin/settings/dimensions/mission", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
}
