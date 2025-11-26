package acceptance_test

import (
	"time"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/playwright-community/playwright-go"
)

var _ = Describe("E2E: User Home Page and Survey History", func() {
	var (
		testUserID = "e2e_demo"
		testTeamID = "e2e_team1"
	)

	Describe("Survey submission with comments and redirect to home page", func() {
		Context("when a team member submits a survey with comments", func() {
			It("should save comments to database and redirect to user home page", func() {
				By("Opening browser and logging in as team member")
				page, err := browser.NewPage()
				Expect(err).NotTo(HaveOccurred())
				defer page.Close()

				// Navigate to login page
				_, err = page.Goto(frontendURL + "/login")
				Expect(err).NotTo(HaveOccurred())

				// Login as team member
				err = page.Locator("#username").Fill("e2e_demo")
				Expect(err).NotTo(HaveOccurred())
				err = page.Locator("#password").Fill("demo")
				Expect(err).NotTo(HaveOccurred())
				err = page.Locator("button[type='submit']:has-text('Sign In')").Click()
				Expect(err).NotTo(HaveOccurred())

				// Wait for redirect to survey page
				err = page.WaitForURL("**/survey", playwright.PageWaitForURLOptions{
					Timeout: playwright.Float(5000),
				})
				Expect(err).NotTo(HaveOccurred())

				// Wait for survey to load
				err = page.Locator("text=Mission").WaitFor(playwright.LocatorWaitForOptions{
					State:   playwright.WaitForSelectorStateVisible,
					Timeout: playwright.Float(10000),
				})
				Expect(err).NotTo(HaveOccurred())

				By("Completing first dimension with a comment")
				// Select score (Green = 3)
				err = page.Locator("[data-dimension='mission'][data-score='3']").Click()
				Expect(err).NotTo(HaveOccurred())
				time.Sleep(300 * time.Millisecond)

				// Select trend (Improving)
				err = page.Locator("[data-dimension='mission'][data-trend='improving']").Click()
				Expect(err).NotTo(HaveOccurred())
				time.Sleep(300 * time.Millisecond)

				// Add a comment - THIS IS THE KEY TEST
				commentTextarea := page.Locator("[data-dimension='mission'] ~ * textarea, textarea")
				err = commentTextarea.First().WaitFor(playwright.LocatorWaitForOptions{
					State:   playwright.WaitForSelectorStateVisible,
					Timeout: playwright.Float(3000),
				})
				Expect(err).NotTo(HaveOccurred())
				err = commentTextarea.First().Fill("Our mission is crystal clear and we're all aligned - E2E test comment")
				Expect(err).NotTo(HaveOccurred())

				// Click Next to proceed
				err = page.Locator("button:has-text('Next')").Click()
				Expect(err).NotTo(HaveOccurred())
				time.Sleep(500 * time.Millisecond)

				By("Completing remaining dimensions without comments (for speed)")
				dimensions := []struct {
					id    string
					score int
					trend string
				}{
					{"value", 2, "stable"},
					{"speed", 2, "stable"},
					{"fun", 3, "improving"},
					{"health", 2, "stable"},
					{"learning", 3, "improving"},
					{"support", 2, "stable"},
					{"pawns", 3, "improving"},
					{"release", 2, "stable"},
					{"process", 2, "stable"},
					{"teamwork", 3, "improving"},
				}

				for i, dim := range dimensions {
					// Select score
					scoreSelector := "[data-dimension='" + dim.id + "'][data-score='" + string(rune('0'+dim.score)) + "']"
					err = page.Locator(scoreSelector).WaitFor(playwright.LocatorWaitForOptions{
						State:   playwright.WaitForSelectorStateVisible,
						Timeout: playwright.Float(5000),
					})
					Expect(err).NotTo(HaveOccurred())
					err = page.Locator(scoreSelector).Click()
					Expect(err).NotTo(HaveOccurred())
					time.Sleep(200 * time.Millisecond)

					// Select trend
					trendSelector := "[data-dimension='" + dim.id + "'][data-trend='" + dim.trend + "']"
					err = page.Locator(trendSelector).WaitFor(playwright.LocatorWaitForOptions{
						State:   playwright.WaitForSelectorStateVisible,
						Timeout: playwright.Float(3000),
					})
					Expect(err).NotTo(HaveOccurred())
					err = page.Locator(trendSelector).Click()
					Expect(err).NotTo(HaveOccurred())
					time.Sleep(200 * time.Millisecond)

					// Click Next (except for last dimension)
					if i < len(dimensions)-1 {
						err = page.Locator("button:has-text('Next')").Click()
						Expect(err).NotTo(HaveOccurred())
						time.Sleep(300 * time.Millisecond)
					}
				}

				By("Submitting the survey")
				submitButton := page.Locator("button[type='submit']:has-text('Submit')")
				err = submitButton.WaitFor(playwright.LocatorWaitForOptions{
					State:   playwright.WaitForSelectorStateVisible,
					Timeout: playwright.Float(3000),
				})
				Expect(err).NotTo(HaveOccurred())
				err = submitButton.Click()
				Expect(err).NotTo(HaveOccurred())

				By("Verifying redirect to user home page (not Thank You page)")
				// After submission, user should be redirected to /home (or /my-dashboard)
				// The home page should show their survey history
				err = page.WaitForURL("**/home", playwright.PageWaitForURLOptions{
					Timeout: playwright.Float(10000),
				})
				Expect(err).NotTo(HaveOccurred())

				By("Verifying home page displays user's survey history")
				// Should see a section showing past surveys
				// Use First() to avoid strict mode violations when multiple elements match
				surveyHistory := page.Locator("[data-testid='survey-history']").Or(page.Locator("text=Survey History"))
				err = surveyHistory.First().WaitFor(playwright.LocatorWaitForOptions{
					State:   playwright.WaitForSelectorStateVisible,
					Timeout: playwright.Float(10000),
				})
				Expect(err).NotTo(HaveOccurred())

				By("Verifying the just-submitted survey appears in history")
				// Should show the team name and submission date
				recentSurvey := page.Locator("[data-testid='survey-entry']").Or(page.Locator("text=E2E Team Alpha")).Or(page.Locator("text=today")).Or(page.Locator("text=just now"))
				err = recentSurvey.First().WaitFor(playwright.LocatorWaitForOptions{
					State:   playwright.WaitForSelectorStateVisible,
					Timeout: playwright.Float(5000),
				})
				Expect(err).NotTo(HaveOccurred())

				By("Verifying comment was saved to database")
				var savedComment string
				err = db.QueryRow(`
					SELECT hcr.comment
					FROM health_check_responses hcr
					JOIN health_check_sessions hcs ON hcr.session_id = hcs.id
					WHERE hcs.user_id = $1 AND hcs.team_id = $2 AND hcr.dimension_id = 'mission'
					ORDER BY hcs.created_at DESC
					LIMIT 1
				`, testUserID, testTeamID).Scan(&savedComment)
				Expect(err).NotTo(HaveOccurred())
				Expect(savedComment).To(ContainSubstring("E2E test comment"))

				GinkgoWriter.Printf("Comment saved successfully: %s\n", savedComment)
			})
		})
	})

	Describe("User home page displays personal trends", func() {
		Context("when a user has submitted multiple surveys", func() {
			BeforeEach(func() {
				// Seed additional historical survey data for trend display
				// Create a new user for trend testing
				_, _ = db.Exec(`
					INSERT INTO users (id, username, email, full_name, hierarchy_level_id, reports_to, password_hash) VALUES
					('e2e_trend_user', 'e2e_trend_user', 'e2e_trend@teams360.demo', 'E2E Trend User', 'level-5', 'e2e_lead1', $1)
					ON CONFLICT (id) DO NOTHING
				`, DemoPasswordHash)

				// Add user to team
				_, _ = db.Exec(`
					INSERT INTO team_members (team_id, user_id) VALUES ('e2e_team1', 'e2e_trend_user')
					ON CONFLICT DO NOTHING
				`)

				// Insert multiple historical sessions for trend display
				_, _ = db.Exec(`
					INSERT INTO health_check_sessions (id, team_id, user_id, date, assessment_period, completed) VALUES
					('e2e_trend_session1', 'e2e_team1', 'e2e_trend_user', '2023-07-15', '2023 - 1st Half', true),
					('e2e_trend_session2', 'e2e_team1', 'e2e_trend_user', '2024-01-15', '2023 - 2nd Half', true),
					('e2e_trend_session3', 'e2e_team1', 'e2e_trend_user', '2024-07-15', '2024 - 1st Half', true)
					ON CONFLICT (id) DO NOTHING
				`)

				// Insert responses showing improvement trend
				_, _ = db.Exec(`
					INSERT INTO health_check_responses (session_id, dimension_id, score, trend, comment) VALUES
					-- Session 1 (earliest, lowest scores)
					('e2e_trend_session1', 'mission', 1, 'stable', 'Unclear direction'),
					('e2e_trend_session1', 'value', 1, 'declining', 'Low value'),
					('e2e_trend_session1', 'teamwork', 2, 'stable', 'Some issues'),
					-- Session 2 (middle, improving)
					('e2e_trend_session2', 'mission', 2, 'improving', 'Getting clearer'),
					('e2e_trend_session2', 'value', 2, 'improving', 'Better delivery'),
					('e2e_trend_session2', 'teamwork', 2, 'stable', 'Same as before'),
					-- Session 3 (latest, best scores)
					('e2e_trend_session3', 'mission', 3, 'improving', 'Crystal clear now'),
					('e2e_trend_session3', 'value', 3, 'improving', 'Great value delivery'),
					('e2e_trend_session3', 'teamwork', 3, 'improving', 'Great teamwork')
					ON CONFLICT DO NOTHING
				`)
			})

			It("should display personal trend chart on home page", func() {
				By("Logging in as the trend test user")
				page, err := browser.NewPage()
				Expect(err).NotTo(HaveOccurred())
				defer page.Close()

				_, err = page.Goto(frontendURL + "/login")
				Expect(err).NotTo(HaveOccurred())

				err = page.Locator("#username").Fill("e2e_trend_user")
				Expect(err).NotTo(HaveOccurred())
				err = page.Locator("#password").Fill("demo")
				Expect(err).NotTo(HaveOccurred())
				err = page.Locator("button[type='submit']:has-text('Sign In')").Click()
				Expect(err).NotTo(HaveOccurred())

				// Wait for login redirect to complete (Team Member goes to /survey)
				err = page.WaitForURL("**/survey", playwright.PageWaitForURLOptions{
					Timeout: playwright.Float(10000),
				})
				Expect(err).NotTo(HaveOccurred())

				// Navigate to home page
				_, err = page.Goto(frontendURL + "/home")
				Expect(err).NotTo(HaveOccurred())

				err = page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
					State: playwright.LoadStateNetworkidle,
				})
				Expect(err).NotTo(HaveOccurred())

				By("Verifying personal trend visualization is displayed")
				// Should see a trend chart/graph showing improvement over time
				trendChart := page.Locator("[data-testid='personal-trend-chart'], [data-testid='health-trend'], canvas, svg")
				err = trendChart.First().WaitFor(playwright.LocatorWaitForOptions{
					State:   playwright.WaitForSelectorStateVisible,
					Timeout: playwright.Float(10000),
				})
				Expect(err).NotTo(HaveOccurred())

				By("Verifying survey history section is loaded")
				// Wait for the survey history section to appear (not loading state)
				surveyHistory := page.Locator("[data-testid='survey-history'], [data-testid='survey-entry']")
				err = surveyHistory.First().WaitFor(playwright.LocatorWaitForOptions{
					State:   playwright.WaitForSelectorStateVisible,
					Timeout: playwright.Float(15000),
				})
				Expect(err).NotTo(HaveOccurred())

				By("Verifying assessment periods are shown in survey entries")
				// Check if any text containing "Half" is visible (which indicates assessment periods)
				periods := page.Locator("text=/Half/")
				count, err := periods.Count()
				Expect(err).NotTo(HaveOccurred())
				Expect(count).To(BeNumerically(">=", 1), "Should display at least one survey with assessment period")

				By("Verifying improvement trend indicator")
				// Should show some indicator that health is improving
				improvingIndicator := page.Locator("[data-testid='trend-improving']").Or(page.Locator("text=improving")).Or(page.Locator("text=up")).Or(page.Locator("text=better"))
				err = improvingIndicator.First().WaitFor(playwright.LocatorWaitForOptions{
					State:   playwright.WaitForSelectorStateVisible,
					Timeout: playwright.Float(5000),
				})
				Expect(err).NotTo(HaveOccurred())

				GinkgoWriter.Printf("Personal trend page displayed successfully\n")
			})
		})
	})

	Describe("Survey access for different hierarchy levels", func() {
		// BUSINESS RULE: Only Team Members (level-5) and Team Leads (level-4) can take surveys.
		// Managers, Directors, VPs often supervise multiple teams, making it ambiguous
		// which team their survey response should apply to.
		// Admin users have admin-only functions and cannot take surveys.

		Context("when a Team Member accesses the system", func() {
			It("should allow taking survey", func() {
				By("Logging in as Team Member")
				page, err := browser.NewPage()
				Expect(err).NotTo(HaveOccurred())
				defer page.Close()

				_, err = page.Goto(frontendURL + "/login")
				Expect(err).NotTo(HaveOccurred())

				err = page.Locator("#username").Fill("e2e_demo")
				Expect(err).NotTo(HaveOccurred())
				err = page.Locator("#password").Fill("demo")
				Expect(err).NotTo(HaveOccurred())
				err = page.Locator("button[type='submit']:has-text('Sign In')").Click()
				Expect(err).NotTo(HaveOccurred())

				By("Verifying Team Member is redirected to survey page")
				err = page.WaitForURL("**/survey", playwright.PageWaitForURLOptions{
					Timeout: playwright.Float(10000),
				})
				Expect(err).NotTo(HaveOccurred())

				// Should see survey page (Mission dimension)
				surveyContent := page.Locator("text=Mission")
				err = surveyContent.WaitFor(playwright.LocatorWaitForOptions{
					State:   playwright.WaitForSelectorStateVisible,
					Timeout: playwright.Float(10000),
				})
				Expect(err).NotTo(HaveOccurred())

				GinkgoWriter.Printf("Team Member survey access verified\n")
			})
		})

		Context("when a Team Lead accesses the system", func() {
			It("should allow taking survey and show option to view team dashboard", func() {
				By("Logging in as Team Lead")
				page, err := browser.NewPage()
				Expect(err).NotTo(HaveOccurred())
				defer page.Close()

				_, err = page.Goto(frontendURL + "/login")
				Expect(err).NotTo(HaveOccurred())

				err = page.Locator("#username").Fill("e2e_lead1")
				Expect(err).NotTo(HaveOccurred())
				err = page.Locator("#password").Fill("demo")
				Expect(err).NotTo(HaveOccurred())
				err = page.Locator("button[type='submit']:has-text('Sign In')").Click()
				Expect(err).NotTo(HaveOccurred())

				// Wait for login redirect to complete (Team Lead goes to /dashboard)
				err = page.WaitForURL("**/dashboard", playwright.PageWaitForURLOptions{
					Timeout: playwright.Float(10000),
				})
				Expect(err).NotTo(HaveOccurred())

				By("Verifying Team Lead can access survey")
				// Team Lead should be able to take surveys
				_, err = page.Goto(frontendURL + "/survey")
				Expect(err).NotTo(HaveOccurred())

				err = page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
					State: playwright.LoadStateNetworkidle,
				})
				Expect(err).NotTo(HaveOccurred())

				// Should see survey page (Mission dimension)
				surveyContent := page.Locator("text=Mission")
				err = surveyContent.WaitFor(playwright.LocatorWaitForOptions{
					State:   playwright.WaitForSelectorStateVisible,
					Timeout: playwright.Float(10000),
				})
				Expect(err).NotTo(HaveOccurred())

				By("Verifying Team Lead can see link to team dashboard")
				// Should have option to view team dashboard
				dashboardLink := page.Locator("a[href*='dashboard']").Or(page.Locator("a[href*='manager']")).Or(page.Locator("text=Team Dashboard")).Or(page.Locator("text=View Dashboard"))
				err = dashboardLink.First().WaitFor(playwright.LocatorWaitForOptions{
					State:   playwright.WaitForSelectorStateVisible,
					Timeout: playwright.Float(5000),
				})
				Expect(err).NotTo(HaveOccurred())

				GinkgoWriter.Printf("Team Lead survey access verified\n")
			})
		})

		Context("when a Manager accesses the system", func() {
			It("should NOT be able to take survey (supervises multiple teams)", func() {
				By("Logging in as Manager")
				page, err := browser.NewPage()
				Expect(err).NotTo(HaveOccurred())
				defer page.Close()

				_, err = page.Goto(frontendURL + "/login")
				Expect(err).NotTo(HaveOccurred())

				err = page.Locator("#username").Fill("e2e_manager1")
				Expect(err).NotTo(HaveOccurred())
				err = page.Locator("#password").Fill("demo")
				Expect(err).NotTo(HaveOccurred())
				err = page.Locator("button[type='submit']:has-text('Sign In')").Click()
				Expect(err).NotTo(HaveOccurred())

				By("Verifying Manager is redirected to manager dashboard, not survey")
				err = page.WaitForURL("**/manager", playwright.PageWaitForURLOptions{
					Timeout: playwright.Float(10000),
				})
				Expect(err).NotTo(HaveOccurred())

				By("Verifying Manager cannot access survey page")
				_, err = page.Goto(frontendURL + "/survey")
				Expect(err).NotTo(HaveOccurred())

				// Wait for potential redirect
				time.Sleep(2 * time.Second)

				// Manager should be redirected away from /survey
				currentURL := page.URL()
				Expect(currentURL).NotTo(ContainSubstring("/survey"), "Manager should not be able to access survey page")

				GinkgoWriter.Printf("Manager survey restriction verified\n")
			})
		})

		Context("when an Admin accesses the system", func() {
			It("should NOT be able to take survey (admin-only role)", func() {
				// First, ensure we have an admin user
				_, _ = db.Exec(`
					INSERT INTO users (id, username, email, full_name, hierarchy_level_id, reports_to, password_hash) VALUES
					('e2e_admin', 'e2e_admin', 'e2e_admin@teams360.demo', 'E2E Admin User', 'level-admin', NULL, '$2a$10$OFyj3qtGv0zgv3r3kn9h/OvqyNxNgh7vOCvrF56HyBMcU73QU4LtG')
					ON CONFLICT (id) DO NOTHING
				`)

				By("Logging in as Admin")
				page, err := browser.NewPage()
				Expect(err).NotTo(HaveOccurred())
				defer page.Close()

				_, err = page.Goto(frontendURL + "/login")
				Expect(err).NotTo(HaveOccurred())

				err = page.Locator("#username").Fill("e2e_admin")
				Expect(err).NotTo(HaveOccurred())
				err = page.Locator("#password").Fill("demo")
				Expect(err).NotTo(HaveOccurred())
				err = page.Locator("button[type='submit']:has-text('Sign In')").Click()
				Expect(err).NotTo(HaveOccurred())

				By("Verifying Admin is redirected to admin dashboard, not survey")
				// Admin should be redirected to /admin, NOT /survey
				err = page.WaitForURL("**/admin", playwright.PageWaitForURLOptions{
					Timeout: playwright.Float(10000),
				})
				Expect(err).NotTo(HaveOccurred())

				By("Verifying Admin cannot access survey page")
				// Try to navigate to survey - should be redirected away
				_, err = page.Goto(frontendURL + "/survey")
				Expect(err).NotTo(HaveOccurred())

				// Wait for potential redirect
				time.Sleep(2 * time.Second)

				// Should NOT see survey content, should be redirected
				currentURL := page.URL()
				Expect(currentURL).NotTo(ContainSubstring("/survey"), "Admin should not be able to access survey page")

				GinkgoWriter.Printf("Admin survey restriction verified\n")
			})
		})
	})
})
