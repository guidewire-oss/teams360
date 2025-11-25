package integration_test

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"time"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/gin-gonic/gin"
	"github.com/golang-migrate/migrate/v4"
	migratePostgres "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/lib/pq"

	"github.com/agopalakrishnan/teams360/backend/infrastructure/persistence/postgres"
	"github.com/agopalakrishnan/teams360/backend/interfaces/api/v1"
)

var _ = Describe("Integration: Manager Dashboard API", func() {
	var (
		db     *sql.DB
		router *gin.Engine
		err    error
	)

	BeforeEach(func() {
		// Set Gin to test mode
		gin.SetMode(gin.TestMode)

		// Connect to test database
		databaseURL := os.Getenv("TEST_DATABASE_URL")
		if databaseURL == "" {
			databaseURL = "postgres://postgres:postgres@localhost:5432/teams360_test?sslmode=disable"
		}

		db, err = sql.Open("postgres", databaseURL)
		Expect(err).NotTo(HaveOccurred())
		Expect(db.Ping()).To(Succeed())

		// Clean and run migrations
		_, err = db.Exec("DROP SCHEMA public CASCADE; CREATE SCHEMA public;")
		Expect(err).NotTo(HaveOccurred())

		driver, err := migratePostgres.WithInstance(db, &migratePostgres.Config{})
		Expect(err).NotTo(HaveOccurred())

		migrationEngine, err := migrate.NewWithDatabaseInstance(
			"file://../../infrastructure/persistence/postgres/migrations",
			"postgres",
			driver,
		)
		Expect(err).NotTo(HaveOccurred())

		err = migrationEngine.Up()
		Expect(err).NotTo(HaveOccurred())

		// Initialize router with API routes
		router = gin.New()
		healthCheckRepo := postgres.NewHealthCheckRepository(db)
		v1.SetupHealthCheckRoutesWithDB(router, db, healthCheckRepo)

		// Setup manager routes (to be implemented)
		v1.SetupManagerRoutes(router, db)
	})

	AfterEach(func() {
		if db != nil {
			db.Close()
		}
	})

	Describe("GET /api/v1/managers/:managerId/teams/health", func() {
		Context("when a manager views their supervised teams", func() {
			It("should return aggregated health metrics for all supervised teams", func() {
				// Given: Create organizational hierarchy
				// Manager oversees 2 teams with different health check submissions

				// Create users
				_, err := db.Exec(`
					INSERT INTO users (id, username, email, full_name, hierarchy_level_id, reports_to)
					VALUES
						('manager1', 'manager1', 'manager1@test.com', 'Manager One', 'level-3', NULL),
						('lead1', 'lead1', 'lead1@test.com', 'Lead One', 'level-4', 'manager1'),
						('lead2', 'lead2', 'lead2@test.com', 'Lead Two', 'level-4', 'manager1'),
						('member1', 'member1', 'member1@test.com', 'Member One', 'level-5', 'lead1'),
						('member2', 'member2', 'member2@test.com', 'Member Two', 'level-5', 'lead1'),
						('member3', 'member3', 'member3@test.com', 'Member Three', 'level-5', 'lead2')
				`)
				Expect(err).NotTo(HaveOccurred())

				// Create teams
				_, err = db.Exec(`
					INSERT INTO teams (id, name, team_lead_id)
					VALUES
						('team1', 'Alpha Squad', 'lead1'),
						('team2', 'Beta Squad', 'lead2')
				`)
				Expect(err).NotTo(HaveOccurred())

				// Add team members
				_, err = db.Exec(`
					INSERT INTO team_members (team_id, user_id)
					VALUES
						('team1', 'lead1'),
						('team1', 'member1'),
						('team1', 'member2'),
						('team2', 'lead2'),
						('team2', 'member3')
				`)
				Expect(err).NotTo(HaveOccurred())

				// Add supervisor chains
				_, err = db.Exec(`
					INSERT INTO team_supervisors (team_id, user_id, hierarchy_level_id, position)
					VALUES
						('team1', 'lead1', 'level-4', 1),
						('team1', 'manager1', 'level-3', 2),
						('team2', 'lead2', 'level-4', 1),
						('team2', 'manager1', 'level-3', 2)
				`)
				Expect(err).NotTo(HaveOccurred())

				// Create health check sessions for Team 1 (good health)
				currentDate := time.Now().Format("2006-01-02")
				_, err = db.Exec(`
					INSERT INTO health_check_sessions (id, team_id, user_id, date, assessment_period, completed)
					VALUES
						('session1', 'team1', 'member1', $1, '2024 - 2nd Half', true),
						('session2', 'team1', 'member2', $1, '2024 - 2nd Half', true)
				`, currentDate)
				Expect(err).NotTo(HaveOccurred())

				// Add responses for Team 1 (average score ~2.5 - good)
				_, err = db.Exec(`
					INSERT INTO health_check_responses (session_id, dimension_id, score, trend, comment)
					VALUES
						('session1', 'mission', 3, 'improving', 'Clear goals'),
						('session1', 'value', 2, 'stable', 'Good value'),
						('session2', 'mission', 3, 'stable', 'Clear mission'),
						('session2', 'value', 2, 'improving', 'Delivering well')
				`)
				Expect(err).NotTo(HaveOccurred())

				// Create health check sessions for Team 2 (needs support)
				_, err = db.Exec(`
					INSERT INTO health_check_sessions (id, team_id, user_id, date, assessment_period, completed)
					VALUES
						('session3', 'team2', 'member3', $1, '2024 - 2nd Half', true)
				`, currentDate)
				Expect(err).NotTo(HaveOccurred())

				// Add responses for Team 2 (average score ~1.5 - needs support)
				_, err = db.Exec(`
					INSERT INTO health_check_responses (session_id, dimension_id, score, trend, comment)
					VALUES
						('session3', 'mission', 2, 'declining', 'Unclear direction'),
						('session3', 'value', 1, 'declining', 'Struggling')
				`)
				Expect(err).NotTo(HaveOccurred())

				// When: Manager requests their dashboard
				req := httptest.NewRequest(http.MethodGet, "/api/v1/managers/manager1/teams/health", nil)
				w := httptest.NewRecorder()
				router.ServeHTTP(w, req)

				// Then: Should return 200 OK
				Expect(w.Code).To(Equal(http.StatusOK))

				// And: Response should contain aggregated team health
				var response map[string]interface{}
				err = json.Unmarshal(w.Body.Bytes(), &response)
				Expect(err).NotTo(HaveOccurred())

				// Verify manager ID
				Expect(response["managerId"]).To(Equal("manager1"))

				// Verify we have 2 teams
				teams := response["teams"].([]interface{})
				Expect(teams).To(HaveLen(2))

				// Verify Team 1 (Alpha Squad) - better health
				team1 := findTeamByName(teams, "Alpha Squad")
				Expect(team1).NotTo(BeNil())
				Expect(team1["teamId"]).To(Equal("team1"))
				Expect(team1["submissionCount"]).To(BeNumerically("==", 2))

				// Average of Team 1: (3+2+3+2)/4 = 2.5
				team1Health := team1["overallHealth"].(float64)
				Expect(team1Health).To(BeNumerically("~", 2.5, 0.1))

				// Verify Team 2 (Beta Squad) - needs support
				team2 := findTeamByName(teams, "Beta Squad")
				Expect(team2).NotTo(BeNil())
				Expect(team2["teamId"]).To(Equal("team2"))
				Expect(team2["submissionCount"]).To(BeNumerically("==", 1))

				// Average of Team 2: (2+1)/2 = 1.5
				team2Health := team2["overallHealth"].(float64)
				Expect(team2Health).To(BeNumerically("~", 1.5, 0.1))

				// Verify teams are sorted by health (worst first for attention)
				firstTeam := teams[0].(map[string]interface{})
				Expect(firstTeam["teamName"]).To(Equal("Beta Squad")) // Lower health comes first

				// Verify dimension-level aggregation
				team1Dimensions := team1["dimensions"].([]interface{})
				Expect(team1Dimensions).To(HaveLen(2)) // mission and value

				missionDim := findDimensionById(team1Dimensions, "mission")
				Expect(missionDim).NotTo(BeNil())
				Expect(missionDim["avgScore"]).To(BeNumerically("==", 3.0)) // (3+3)/2
				Expect(missionDim["responseCount"]).To(BeNumerically("==", 2))

				// Verify total count
				Expect(response["totalTeams"]).To(BeNumerically("==", 2))
			})

			It("should filter by assessment period", func() {
				// Given: Manager with teams that have health checks in different periods

				// Create manager and team
				_, err := db.Exec(`
					INSERT INTO users (id, username, email, full_name, hierarchy_level_id)
					VALUES ('manager1', 'manager1', 'manager1@test.com', 'Manager One', 'level-3')
				`)
				Expect(err).NotTo(HaveOccurred())

				_, err = db.Exec(`
					INSERT INTO teams (id, name, team_lead_id)
					VALUES ('team1', 'Alpha Squad', 'manager1')
				`)
				Expect(err).NotTo(HaveOccurred())

				_, err = db.Exec(`
					INSERT INTO team_supervisors (team_id, user_id, hierarchy_level_id, position)
					VALUES ('team1', 'manager1', 'level-3', 1)
				`)
				Expect(err).NotTo(HaveOccurred())

				// Create sessions in different periods
				_, err = db.Exec(`
					INSERT INTO health_check_sessions (id, team_id, user_id, date, assessment_period, completed)
					VALUES
						('session1', 'team1', 'manager1', '2024-01-15', '2023 - 2nd Half', true),
						('session2', 'team1', 'manager1', '2024-07-15', '2024 - 1st Half', true)
				`)
				Expect(err).NotTo(HaveOccurred())

				_, err = db.Exec(`
					INSERT INTO health_check_responses (session_id, dimension_id, score, trend)
					VALUES
						('session1', 'mission', 2, 'stable'),
						('session2', 'mission', 3, 'improving')
				`)
				Expect(err).NotTo(HaveOccurred())

				// When: Manager filters by specific period
				req := httptest.NewRequest(http.MethodGet, "/api/v1/managers/manager1/teams/health?assessmentPeriod=2024+-+1st+Half", nil)
				w := httptest.NewRecorder()
				router.ServeHTTP(w, req)

				// Then: Should only include data from that period
				Expect(w.Code).To(Equal(http.StatusOK))

				var response map[string]interface{}
				json.Unmarshal(w.Body.Bytes(), &response)

				Expect(response["assessmentPeriod"]).To(Equal("2024 - 1st Half"))

				teams := response["teams"].([]interface{})
				team1 := teams[0].(map[string]interface{})

				// Should only have 1 submission from 2024 - 1st Half
				Expect(team1["submissionCount"]).To(BeNumerically("==", 1))

				dimensions := team1["dimensions"].([]interface{})
				mission := dimensions[0].(map[string]interface{})
				Expect(mission["avgScore"]).To(BeNumerically("==", 3.0)) // Only session2's score
			})

			It("should only return teams in the manager's hierarchy", func() {
				// Given: Two managers with different teams

				_, err := db.Exec(`
					INSERT INTO users (id, username, email, full_name, hierarchy_level_id)
					VALUES
						('manager1', 'manager1', 'manager1@test.com', 'Manager One', 'level-3'),
						('manager2', 'manager2', 'manager2@test.com', 'Manager Two', 'level-3')
				`)
				Expect(err).NotTo(HaveOccurred())

				_, err = db.Exec(`
					INSERT INTO teams (id, name, team_lead_id)
					VALUES
						('team1', 'Manager 1 Team', 'manager1'),
						('team2', 'Manager 2 Team', 'manager2')
				`)
				Expect(err).NotTo(HaveOccurred())

				_, err = db.Exec(`
					INSERT INTO team_supervisors (team_id, user_id, hierarchy_level_id, position)
					VALUES
						('team1', 'manager1', 'level-3', 1),
						('team2', 'manager2', 'level-3', 1)
				`)
				Expect(err).NotTo(HaveOccurred())

				// When: Manager 1 requests dashboard
				req := httptest.NewRequest(http.MethodGet, "/api/v1/managers/manager1/teams/health", nil)
				w := httptest.NewRecorder()
				router.ServeHTTP(w, req)

				// Then: Should only see their own teams
				Expect(w.Code).To(Equal(http.StatusOK))

				var response map[string]interface{}
				json.Unmarshal(w.Body.Bytes(), &response)

				teams := response["teams"].([]interface{})
				Expect(teams).To(HaveLen(1))

				team := teams[0].(map[string]interface{})
				Expect(team["teamName"]).To(Equal("Manager 1 Team"))
			})
		})
	})
})

// Helper functions
func findTeamByName(teams []interface{}, name string) map[string]interface{} {
	for _, t := range teams {
		team := t.(map[string]interface{})
		if team["teamName"] == name {
			return team
		}
	}
	return nil
}

func findDimensionById(dimensions []interface{}, id string) map[string]interface{} {
	for _, d := range dimensions {
		dim := d.(map[string]interface{})
		if dim["dimensionId"] == id {
			return dim
		}
	}
	return nil
}
