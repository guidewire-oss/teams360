package integration_test

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"

	"github.com/agopalakrishnan/teams360/backend/infrastructure/persistence/postgres"
	"github.com/agopalakrishnan/teams360/backend/interfaces/api/v1"
	"github.com/agopalakrishnan/teams360/backend/tests/testhelpers"
	"github.com/gin-gonic/gin"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"golang.org/x/crypto/bcrypt"
)

var _ = Describe("Authentication API Integration Tests", func() {
	var (
		router  *gin.Engine
		db      *sql.DB
		cleanup func()
	)

	BeforeEach(func() {
		// Setup test database with helpers
		db, cleanup = testhelpers.SetupTestDatabase()

		// Setup Gin router
		gin.SetMode(gin.TestMode)
		router = gin.Default()

		// Create user repository and setup auth routes
		userRepo := postgres.NewUserRepository(db)
		v1.SetupAuthRoutes(router, userRepo)
	})

	AfterEach(func() {
		cleanup()
	})

	Describe("POST /api/v1/auth/login", func() {
		Context("when credentials are valid", func() {
			It("should return 200 OK with user data", func() {
				// Given: A user exists in the database with bcrypt hashed password
				hashedPassword, err := bcrypt.GenerateFromPassword([]byte("testpass"), bcrypt.DefaultCost)
				Expect(err).NotTo(HaveOccurred())

				_, err = db.Exec(`
					INSERT INTO users (id, username, email, full_name, hierarchy_level_id, password_hash)
					VALUES ('authtest1', 'authuser', 'authuser@test.com', 'Auth Test User', 'level-4', $1)
				`, string(hashedPassword))
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
				// Given: A user exists in the database with bcrypt hashed password
				hashedPassword, err := bcrypt.GenerateFromPassword([]byte("correctpass"), bcrypt.DefaultCost)
				Expect(err).NotTo(HaveOccurred())

				_, err = db.Exec(`
					INSERT INTO users (id, username, email, full_name, hierarchy_level_id, password_hash)
					VALUES ('authtest1', 'authuser', 'authuser@test.com', 'Auth Test User', 'level-4', $1)
				`, string(hashedPassword))
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
