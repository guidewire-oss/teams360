package acceptance_test

import (
	"database/sql"
	"fmt"
	"os"
	"os/exec"
	"testing"
	"time"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/playwright-community/playwright-go"

	"github.com/golang-migrate/migrate/v4"
	migratePostgres "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/lib/pq"
)

// Shared test resources accessible to all specs
var (
	db          *sql.DB
	backendCmd  *exec.Cmd
	frontendCmd *exec.Cmd
	pw          *playwright.Playwright
	browser     playwright.Browser

	// Test environment URLs
	backendURL  = "http://localhost:8080"
	frontendURL = "http://localhost:3000"
)

func TestAcceptance(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Acceptance Suite")
}

// SynchronizedBeforeSuite runs ONCE across all parallel nodes
// Phase 1: Runs on the first process only (setup shared resources)
// Phase 2: Runs on all processes (receives data from Phase 1)
var _ = SynchronizedBeforeSuite(
	// Phase 1: Runs on process #1 only - setup database and servers
	func() []byte {
		By("Phase 1: Setting up shared test infrastructure (database, servers)")

		// Setup test database
		databaseURL := os.Getenv("TEST_DATABASE_URL")
		if databaseURL == "" {
			databaseURL = "postgres://postgres:postgres@localhost:5432/teams360_test?sslmode=disable"
		}

		var err error
		db, err = sql.Open("postgres", databaseURL)
		Expect(err).NotTo(HaveOccurred())
		Expect(db.Ping()).To(Succeed())

		// Clean and run migrations
		By("Cleaning and migrating test database")
		_, err = db.Exec("DROP SCHEMA public CASCADE; CREATE SCHEMA public;")
		Expect(err).NotTo(HaveOccurred())

		driver, err := migratePostgres.WithInstance(db, &migratePostgres.Config{})
		Expect(err).NotTo(HaveOccurred())

		migrationEngine, err := migrate.NewWithDatabaseInstance(
			"file://../../backend/infrastructure/persistence/postgres/migrations",
			"postgres",
			driver,
		)
		Expect(err).NotTo(HaveOccurred())

		err = migrationEngine.Up()
		Expect(err).NotTo(HaveOccurred())

		// Start backend API server
		By("Starting backend API server")
		backendCmd = exec.Command("go", "run", "cmd/api/main.go")
		backendCmd.Dir = "../../backend"
		backendCmd.Env = append(os.Environ(),
			"PORT=8080",
			fmt.Sprintf("DATABASE_URL=%s", databaseURL),
		)
		backendCmd.Stdout = GinkgoWriter
		backendCmd.Stderr = GinkgoWriter
		err = backendCmd.Start()
		Expect(err).NotTo(HaveOccurred())

		// Wait for backend to be ready
		Eventually(func() error {
			resp, err := exec.Command("curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", backendURL+"/health").Output()
			if err != nil {
				return err
			}
			if string(resp) != "200" {
				return fmt.Errorf("backend not ready, status: %s", string(resp))
			}
			return nil
		}, 30*time.Second, 1*time.Second).Should(Succeed(), "Backend API should start successfully")

		// Start frontend Next.js server
		By("Starting frontend Next.js server")
		frontendCmd = exec.Command("npm", "run", "dev")
		frontendCmd.Dir = "../../frontend"
		frontendCmd.Env = append(os.Environ(),
			fmt.Sprintf("NEXT_PUBLIC_API_URL=%s", backendURL),
		)
		frontendCmd.Stdout = GinkgoWriter
		frontendCmd.Stderr = GinkgoWriter
		err = frontendCmd.Start()
		Expect(err).NotTo(HaveOccurred())

		// Wait for frontend to be ready
		Eventually(func() error {
			resp, err := exec.Command("curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", frontendURL).Output()
			if err != nil {
				return err
			}
			if string(resp) != "200" {
				return fmt.Errorf("frontend not ready, status: %s", string(resp))
			}
			return nil
		}, 60*time.Second, 2*time.Second).Should(Succeed(), "Frontend should start successfully")

		GinkgoWriter.Printf("✅ Test infrastructure ready\n")
		GinkgoWriter.Printf("   Backend:  %s\n", backendURL)
		GinkgoWriter.Printf("   Frontend: %s\n", frontendURL)

		// Return connection info to all processes
		return []byte(databaseURL)
	},

	// Phase 2: Runs on ALL processes - setup Playwright
	func(databaseURL []byte) {
		By("Phase 2: Setting up Playwright (per process)")

		// Each process gets its own Playwright instance
		var err error
		pw, err = playwright.Run()
		Expect(err).NotTo(HaveOccurred())

		browser, err = pw.Chromium.Launch(playwright.BrowserTypeLaunchOptions{
			Headless: playwright.Bool(true), // Set to false for debugging
		})
		Expect(err).NotTo(HaveOccurred())

		// Reconnect to database for this process
		db, err = sql.Open("postgres", string(databaseURL))
		Expect(err).NotTo(HaveOccurred())
		Expect(db.Ping()).To(Succeed())

		GinkgoWriter.Printf("✅ Playwright initialized for process %d\n", GinkgoParallelProcess())
	},
)

// SynchronizedAfterSuite runs ONCE across all parallel nodes
// Phase 1: Runs on all processes
// Phase 2: Runs on process #1 only (cleanup shared resources)
var _ = SynchronizedAfterSuite(
	// Phase 1: Runs on ALL processes - cleanup Playwright
	func() {
		By("Phase 1: Cleaning up Playwright (per process)")

		if browser != nil {
			browser.Close()
		}

		if pw != nil {
			pw.Stop()
		}

		if db != nil {
			db.Close()
		}

		GinkgoWriter.Printf("✅ Playwright cleaned up for process %d\n", GinkgoParallelProcess())
	},

	// Phase 2: Runs on process #1 only - cleanup servers and database
	func() {
		By("Phase 2: Cleaning up shared test infrastructure (database, servers)")

		if backendCmd != nil && backendCmd.Process != nil {
			backendCmd.Process.Kill()
			backendCmd.Wait()
		}

		if frontendCmd != nil && frontendCmd.Process != nil {
			frontendCmd.Process.Kill()
			frontendCmd.Wait()
		}

		// Final database cleanup happens when db.Close() is called in Phase 1

		GinkgoWriter.Printf("✅ Test infrastructure shut down\n")
	},
)

// BeforeEach runs before EACH test spec
var _ = BeforeEach(func() {
	// Reset test data if needed
	// This runs before each It() block
})

// AfterEach runs after EACH test spec
var _ = AfterEach(func() {
	// Cleanup per-test resources if needed
	// This runs after each It() block
})
