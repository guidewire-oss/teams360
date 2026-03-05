package acceptance_test

import (
	"time"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/playwright-community/playwright-go"
)

var _ = Describe("E2E: Admin Supervisor Chain Management", Label("e2e", "admin", "supervisor-chain"), func() {
	var page playwright.Page

	const testTeamID = "sc_test_team"
	const testTeamName = "SC Test Team"

	BeforeEach(func() {
		var err error
		page, err = browser.NewPage()
		Expect(err).NotTo(HaveOccurred())

		err = page.SetViewportSize(1280, 800)
		Expect(err).NotTo(HaveOccurred())

		// Create a fresh test team for each test
		_, err = db.Exec(`
			INSERT INTO teams (id, name, cadence)
			VALUES ($1, $2, 'monthly')
			ON CONFLICT (id) DO UPDATE SET name = $2
		`, testTeamID, testTeamName)
		Expect(err).NotTo(HaveOccurred())

		// Ensure no leftover supervisor chain
		_, err = db.Exec("DELETE FROM team_supervisors WHERE team_id = $1", testTeamID)
		Expect(err).NotTo(HaveOccurred())
	})

	AfterEach(func() {
		// Clean up in FK order
		db.Exec("DELETE FROM team_supervisors WHERE team_id LIKE 'sc_test_%'")
		db.Exec("DELETE FROM teams WHERE id LIKE 'sc_test_%'")

		if page != nil {
			page.Close()
		}
	})

	// Helper function to login as admin
	loginAsAdmin := func() {
		By("Logging in as admin")
		_, err := page.Goto(frontendURL + "/login")
		Expect(err).NotTo(HaveOccurred())

		err = page.Locator("input[name='username']").Fill("admin")
		Expect(err).NotTo(HaveOccurred())

		err = page.Locator("input[name='password']").Fill("admin")
		Expect(err).NotTo(HaveOccurred())

		err = page.Locator("button[type='submit']").Click()
		Expect(err).NotTo(HaveOccurred())

		Eventually(func() string {
			return page.URL()
		}, 10*time.Second, 500*time.Millisecond).Should(ContainSubstring("/admin"))
	}

	// Helper function to navigate to Teams tab
	navigateToTeamsTab := func() {
		By("Navigating to Teams tab")
		teamsTab := page.Locator("[data-testid='teams-tab']").Or(page.Locator("button:has-text('Teams')"))
		Eventually(func() bool {
			visible, _ := teamsTab.IsVisible()
			return visible
		}, 10*time.Second, 500*time.Millisecond).Should(BeTrue())

		err := teamsTab.Click()
		Expect(err).NotTo(HaveOccurred())

		// Wait for teams list to load
		Eventually(func() bool {
			visible, _ := page.Locator("[data-testid='teams-list']").IsVisible()
			return visible
		}, 10*time.Second, 500*time.Millisecond).Should(BeTrue())
	}

	// Helper function to open the supervisor chain modal for the test team
	openSupervisorModal := func() {
		By("Opening supervisor chain modal")
		teamRow := page.Locator("[data-testid='team-row']").Filter(playwright.LocatorFilterOptions{
			HasText: testTeamName,
		})
		Eventually(func() bool {
			visible, _ := teamRow.IsVisible()
			return visible
		}, 5*time.Second, 500*time.Millisecond).Should(BeTrue())

		manageBtn := teamRow.Locator("[data-testid='manage-hierarchy-btn']")
		err := manageBtn.Click()
		Expect(err).NotTo(HaveOccurred())

		Eventually(func() bool {
			visible, _ := page.Locator("[data-testid='supervisor-chain-modal']").IsVisible()
			return visible
		}, 5*time.Second, 500*time.Millisecond).Should(BeTrue())

		// Wait for loading to complete (supervisor rows appear)
		Eventually(func() int {
			rows, _ := page.Locator("[data-testid='supervisor-row']").All()
			return len(rows)
		}, 5*time.Second, 500*time.Millisecond).Should(BeNumerically(">=", 1))
	}

	Context("when admin opens the supervisor chain modal", func() {
		It("should display modal with one empty row for a team with no chain", func() {
			loginAsAdmin()
			navigateToTeamsTab()
			openSupervisorModal()

			By("Verifying modal shows one empty row")
			rows, err := page.Locator("[data-testid='supervisor-row']").All()
			Expect(err).NotTo(HaveOccurred())
			Expect(len(rows)).To(Equal(1))

			// Level select should have empty value
			levelSelect := page.Locator("[data-testid='supervisor-row']").First().Locator("[data-testid='supervisor-level-select']")
			value, err := levelSelect.InputValue()
			Expect(err).NotTo(HaveOccurred())
			Expect(value).To(Equal(""))
		})
	})

	Context("when admin adds a single supervisor", func() {
		It("should save the supervisor to the database", func() {
			loginAsAdmin()
			navigateToTeamsTab()
			openSupervisorModal()

			By("Selecting Manager level")
			firstRow := page.Locator("[data-testid='supervisor-row']").First()
			_, err := firstRow.Locator("[data-testid='supervisor-level-select']").SelectOption(playwright.SelectOptionValues{
				Values: &[]string{"level-3"},
			})
			Expect(err).NotTo(HaveOccurred())

			By("Selecting manager1 user")
			_, err = firstRow.Locator("[data-testid='supervisor-user-select']").SelectOption(playwright.SelectOptionValues{
				Values: &[]string{"manager1"},
			})
			Expect(err).NotTo(HaveOccurred())

			By("Saving the supervisor chain")
			err = page.Locator("[data-testid='save-supervisor-chain-btn']").Click()
			Expect(err).NotTo(HaveOccurred())

			By("Verifying modal closes")
			Eventually(func() bool {
				visible, _ := page.Locator("[data-testid='supervisor-chain-modal']").IsVisible()
				return !visible
			}, 5*time.Second, 500*time.Millisecond).Should(BeTrue())

			By("Verifying supervisor is saved in database")
			var count int
			err = db.QueryRow("SELECT COUNT(*) FROM team_supervisors WHERE team_id = $1", testTeamID).Scan(&count)
			Expect(err).NotTo(HaveOccurred())
			Expect(count).To(Equal(1))

			var userID, levelID string
			err = db.QueryRow("SELECT user_id, hierarchy_level_id FROM team_supervisors WHERE team_id = $1", testTeamID).Scan(&userID, &levelID)
			Expect(err).NotTo(HaveOccurred())
			Expect(userID).To(Equal("manager1"))
			Expect(levelID).To(Equal("level-3"))
		})
	})

	Context("when admin adds multiple supervisors", func() {
		It("should save the full chain to the database", func() {
			loginAsAdmin()
			navigateToTeamsTab()
			openSupervisorModal()

			By("Filling first row: Manager")
			firstRow := page.Locator("[data-testid='supervisor-row']").First()
			_, err := firstRow.Locator("[data-testid='supervisor-level-select']").SelectOption(playwright.SelectOptionValues{
				Values: &[]string{"level-3"},
			})
			Expect(err).NotTo(HaveOccurred())
			_, err = firstRow.Locator("[data-testid='supervisor-user-select']").SelectOption(playwright.SelectOptionValues{
				Values: &[]string{"manager1"},
			})
			Expect(err).NotTo(HaveOccurred())

			By("Adding a second supervisor row")
			err = page.Locator("[data-testid='add-supervisor-btn']").Click()
			Expect(err).NotTo(HaveOccurred())

			Eventually(func() int {
				rows, _ := page.Locator("[data-testid='supervisor-row']").All()
				return len(rows)
			}, 3*time.Second, 200*time.Millisecond).Should(Equal(2))

			By("Filling second row: Director")
			secondRow := page.Locator("[data-testid='supervisor-row']").Nth(1)
			_, err = secondRow.Locator("[data-testid='supervisor-level-select']").SelectOption(playwright.SelectOptionValues{
				Values: &[]string{"level-2"},
			})
			Expect(err).NotTo(HaveOccurred())
			_, err = secondRow.Locator("[data-testid='supervisor-user-select']").SelectOption(playwright.SelectOptionValues{
				Values: &[]string{"director1"},
			})
			Expect(err).NotTo(HaveOccurred())

			By("Saving the chain")
			err = page.Locator("[data-testid='save-supervisor-chain-btn']").Click()
			Expect(err).NotTo(HaveOccurred())

			By("Verifying modal closes")
			Eventually(func() bool {
				visible, _ := page.Locator("[data-testid='supervisor-chain-modal']").IsVisible()
				return !visible
			}, 5*time.Second, 500*time.Millisecond).Should(BeTrue())

			By("Verifying both supervisors are in database")
			var count int
			err = db.QueryRow("SELECT COUNT(*) FROM team_supervisors WHERE team_id = $1", testTeamID).Scan(&count)
			Expect(err).NotTo(HaveOccurred())
			Expect(count).To(Equal(2))

			// Verify manager1 at position 0
			var mgrExists bool
			err = db.QueryRow(
				"SELECT EXISTS(SELECT 1 FROM team_supervisors WHERE team_id = $1 AND user_id = 'manager1' AND hierarchy_level_id = 'level-3')",
				testTeamID,
			).Scan(&mgrExists)
			Expect(err).NotTo(HaveOccurred())
			Expect(mgrExists).To(BeTrue())

			// Verify director1 at position 1
			var dirExists bool
			err = db.QueryRow(
				"SELECT EXISTS(SELECT 1 FROM team_supervisors WHERE team_id = $1 AND user_id = 'director1' AND hierarchy_level_id = 'level-2')",
				testTeamID,
			).Scan(&dirExists)
			Expect(err).NotTo(HaveOccurred())
			Expect(dirExists).To(BeTrue())
		})
	})

	Context("when admin edits an existing supervisor chain", func() {
		BeforeEach(func() {
			// Seed a 2-entry supervisor chain (positions are 1-based)
			_, err := db.Exec(`
				INSERT INTO team_supervisors (team_id, user_id, hierarchy_level_id, position)
				VALUES ($1, 'manager1', 'level-3', 1),
				       ($1, 'director1', 'level-2', 2)
			`, testTeamID)
			Expect(err).NotTo(HaveOccurred())
		})

		It("should load existing chain and allow removing a supervisor", func() {
			loginAsAdmin()
			navigateToTeamsTab()
			openSupervisorModal()

			By("Verifying modal loads with 2 rows")
			Eventually(func() int {
				rows, _ := page.Locator("[data-testid='supervisor-row']").All()
				return len(rows)
			}, 5*time.Second, 500*time.Millisecond).Should(Equal(2))

			By("Removing the second supervisor (Director)")
			secondRemoveBtn := page.Locator("[data-testid='supervisor-row']").Nth(1).Locator("[data-testid='remove-supervisor-btn']")
			err := secondRemoveBtn.Click()
			Expect(err).NotTo(HaveOccurred())

			// Verify only 1 row remains
			Eventually(func() int {
				rows, _ := page.Locator("[data-testid='supervisor-row']").All()
				return len(rows)
			}, 3*time.Second, 200*time.Millisecond).Should(Equal(1))

			By("Saving")
			err = page.Locator("[data-testid='save-supervisor-chain-btn']").Click()
			Expect(err).NotTo(HaveOccurred())

			By("Verifying modal closes")
			Eventually(func() bool {
				visible, _ := page.Locator("[data-testid='supervisor-chain-modal']").IsVisible()
				return !visible
			}, 5*time.Second, 500*time.Millisecond).Should(BeTrue())

			By("Verifying only 1 supervisor remains in database")
			var count int
			err = db.QueryRow("SELECT COUNT(*) FROM team_supervisors WHERE team_id = $1", testTeamID).Scan(&count)
			Expect(err).NotTo(HaveOccurred())
			Expect(count).To(Equal(1))

			var userID string
			err = db.QueryRow("SELECT user_id FROM team_supervisors WHERE team_id = $1", testTeamID).Scan(&userID)
			Expect(err).NotTo(HaveOccurred())
			Expect(userID).To(Equal("manager1"))
		})
	})

	Context("when admin closes modal without saving", func() {
		It("should not modify the database", func() {
			loginAsAdmin()
			navigateToTeamsTab()
			openSupervisorModal()

			By("Selecting a level and user")
			firstRow := page.Locator("[data-testid='supervisor-row']").First()
			_, err := firstRow.Locator("[data-testid='supervisor-level-select']").SelectOption(playwright.SelectOptionValues{
				Values: &[]string{"level-3"},
			})
			Expect(err).NotTo(HaveOccurred())
			_, err = firstRow.Locator("[data-testid='supervisor-user-select']").SelectOption(playwright.SelectOptionValues{
				Values: &[]string{"manager1"},
			})
			Expect(err).NotTo(HaveOccurred())

			By("Clicking the close button without saving")
			err = page.Locator("[data-testid='close-supervisor-modal']").Click()
			Expect(err).NotTo(HaveOccurred())

			By("Verifying modal closes")
			Eventually(func() bool {
				visible, _ := page.Locator("[data-testid='supervisor-chain-modal']").IsVisible()
				return !visible
			}, 5*time.Second, 500*time.Millisecond).Should(BeTrue())

			By("Verifying database has no supervisors for the team")
			var count int
			err = db.QueryRow("SELECT COUNT(*) FROM team_supervisors WHERE team_id = $1", testTeamID).Scan(&count)
			Expect(err).NotTo(HaveOccurred())
			Expect(count).To(Equal(0))
		})
	})
})
