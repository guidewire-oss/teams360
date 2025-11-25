package integration_test

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"

	"github.com/agopalakrishnan/teams360/backend/interfaces/api/v1"
	"github.com/gin-gonic/gin"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("Authentication API Integration Tests", func() {
	var (
		router *gin.Engine
		db     *sql.DB
	)

	BeforeEach(func() {
		// Setup test database connection
		databaseURL := os.Getenv("TEST_DATABASE_URL")
		if databaseURL == "" {
			databaseURL = "postgres://postgres:postgres@localhost:5432/teams360_test?sslmode=disable"
		}

		var err error
		db, err = sql.Open("postgres", databaseURL)
		Expect(err).NotTo(HaveOccurred())
		Expect(db.Ping()).NotTo(HaveOccurred())

		// Clean up test data
		_, err = db.Exec(`DELETE FROM users WHERE id IN ('testuser1', 'authtest1')`)
		Expect(err).NotTo(HaveOccurred())

		// Setup Gin router
		gin.SetMode(gin.TestMode)
		router = gin.Default()
		v1.SetupAuthRoutes(router, db)
	})

	AfterEach(func() {
		if db != nil {
			db.Close()
		}
	})

	Describe("POST /api/v1/auth/login", func() {
		Context("when credentials are valid", func() {
			It("should return 200 OK with user data", func() {
				// Given: A user exists in the database
				_, err := db.Exec(`
					INSERT INTO users (id, username, email, full_name, hierarchy_level_id, password_hash)
					VALUES ('authtest1', 'authuser', 'authuser@test.com', 'Auth Test User', 'level-4', 'testpass')
				`)
				Expect(err).NotTo(HaveOccurred())

				// When: User submits valid credentials
				loginData := map[string]string{
					"username": "authuser",
					"password": "testpass",
				}
				jsonData, _ := json.Marshal(loginData)
				req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(jsonData))
				req.Header.Set("Content-Type", "application/json")

				w := httptest.NewRecorder()
				router.ServeHTTP(w, req)

				// Then: Response should be 200 OK
				Expect(w.Code).To(Equal(http.StatusOK))

				// And: Response should contain user data (excluding password)
				var response map[string]interface{}
				err = json.Unmarshal(w.Body.Bytes(), &response)
				Expect(err).NotTo(HaveOccurred())

				user := response["user"].(map[string]interface{})
				Expect(user["id"]).To(Equal("authtest1"))
				Expect(user["username"]).To(Equal("authuser"))
				Expect(user["email"]).To(Equal("authuser@test.com"))
				Expect(user["fullName"]).To(Equal("Auth Test User"))
				Expect(user["hierarchyLevel"]).To(Equal("level-4"))
				Expect(user).NotTo(HaveKey("passwordHash"))
			})
		})

		Context("when username is invalid", func() {
			It("should return 401 Unauthorized", func() {
				// When: User submits non-existent username
				loginData := map[string]string{
					"username": "nonexistentuser",
					"password": "anypassword",
				}
				jsonData, _ := json.Marshal(loginData)
				req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(jsonData))
				req.Header.Set("Content-Type", "application/json")

				w := httptest.NewRecorder()
				router.ServeHTTP(w, req)

				// Then: Response should be 401 Unauthorized
				Expect(w.Code).To(Equal(http.StatusUnauthorized))

				// And: Error message should be returned
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				Expect(err).NotTo(HaveOccurred())
				Expect(response["error"]).To(Equal("Invalid username or password"))
			})
		})

		Context("when password is incorrect", func() {
			It("should return 401 Unauthorized", func() {
				// Given: A user exists in the database
				_, err := db.Exec(`
					INSERT INTO users (id, username, email, full_name, hierarchy_level_id, password_hash)
					VALUES ('authtest1', 'authuser', 'authuser@test.com', 'Auth Test User', 'level-4', 'correctpass')
				`)
				Expect(err).NotTo(HaveOccurred())

				// When: User submits incorrect password
				loginData := map[string]string{
					"username": "authuser",
					"password": "wrongpassword",
				}
				jsonData, _ := json.Marshal(loginData)
				req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(jsonData))
				req.Header.Set("Content-Type", "application/json")

				w := httptest.NewRecorder()
				router.ServeHTTP(w, req)

				// Then: Response should be 401 Unauthorized
				Expect(w.Code).To(Equal(http.StatusUnauthorized))

				// And: Error message should be returned
				var response map[string]interface{}
				err = json.Unmarshal(w.Body.Bytes(), &response)
				Expect(err).NotTo(HaveOccurred())
				Expect(response["error"]).To(Equal("Invalid username or password"))
			})
		})

		Context("when credentials are missing", func() {
			It("should return 400 Bad Request when username is missing", func() {
				// When: Request is missing username
				loginData := map[string]string{
					"password": "testpass",
				}
				jsonData, _ := json.Marshal(loginData)
				req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(jsonData))
				req.Header.Set("Content-Type", "application/json")

				w := httptest.NewRecorder()
				router.ServeHTTP(w, req)

				// Then: Response should be 400 Bad Request
				Expect(w.Code).To(Equal(http.StatusBadRequest))

				// And: Error message should indicate missing field
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				Expect(err).NotTo(HaveOccurred())
				Expect(response["error"]).To(Equal("Username and password are required"))
			})

			It("should return 400 Bad Request when password is missing", func() {
				// When: Request is missing password
				loginData := map[string]string{
					"username": "testuser",
				}
				jsonData, _ := json.Marshal(loginData)
				req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(jsonData))
				req.Header.Set("Content-Type", "application/json")

				w := httptest.NewRecorder()
				router.ServeHTTP(w, req)

				// Then: Response should be 400 Bad Request
				Expect(w.Code).To(Equal(http.StatusBadRequest))

				// And: Error message should indicate missing field
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				Expect(err).NotTo(HaveOccurred())
				Expect(response["error"]).To(Equal("Username and password are required"))
			})
		})
	})
})
