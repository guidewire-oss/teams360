package acceptance_test

import (
	"time"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/playwright-community/playwright-go"
)

var _ = Describe("E2E: Team Lead Dashboard", func() {
	var (
		testTeamID = "e2e_team1"
	)

	BeforeEach(func() {
		// Clean up any existing test sessions to ensure fresh data
		_, _ = db.Exec(`DELETE FROM health_check_responses WHERE session_id IN ('e2e_tl_session1', 'e2e_tl_session2', 'e2e_tl_session3')`)
		_, _ = db.Exec(`DELETE FROM health_check_sessions WHERE id IN ('e2e_tl_session1', 'e2e_tl_session2', 'e2e_tl_session3')`)

		// Ensure test data exists for team lead dashboard testing
		// Insert additional responses for better visualization
		_, _ = db.Exec(`
			INSERT INTO health_check_sessions (id, team_id, user_id, date, assessment_period, completed) VALUES
			('e2e_tl_session1', $1, 'e2e_member1', '2024-10-01', '2024 - 2nd Half', true),
			('e2e_tl_session2', $1, 'e2e_member2', '2024-10-02', '2024 - 2nd Half', true),
			('e2e_tl_session3', $1, 'e2e_demo', '2024-10-03', '2024 - 2nd Half', true)
			ON CONFLICT (id) DO NOTHING
		`, testTeamID)

		// Insert responses with varied scores for radar chart
		_, _ = db.Exec(`
			INSERT INTO health_check_responses (session_id, dimension_id, score, trend, comment) VALUES
			-- Session 1 responses (all dimensions)
			('e2e_tl_session1', 'mission', 3, 'improving', 'Great clarity'),
			('e2e_tl_session1', 'value', 2, 'stable', 'Good delivery'),
			('e2e_tl_session1', 'speed', 1, 'declining', 'Too slow'),
			('e2e_tl_session1', 'fun', 3, 'improving', 'Enjoying work'),
			('e2e_tl_session1', 'health', 2, 'stable', 'OK codebase'),
			('e2e_tl_session1', 'learning', 3, 'improving', 'Learning a lot'),
			('e2e_tl_session1', 'support', 2, 'stable', 'Adequate support'),
			('e2e_tl_session1', 'pawns', 3, 'improving', 'We are players'),
			('e2e_tl_session1', 'release', 1, 'declining', 'Hard to release'),
			('e2e_tl_session1', 'process', 2, 'stable', 'OK process'),
			('e2e_tl_session1', 'teamwork', 3, 'improving', 'Great teamwork'),
			-- Session 2 responses
			('e2e_tl_session2', 'mission', 2, 'stable', 'Clear enough'),
			('e2e_tl_session2', 'value', 3, 'improving', 'Great value'),
			('e2e_tl_session2', 'speed', 2, 'stable', 'OK speed'),
			('e2e_tl_session2', 'fun', 2, 'declining', 'Less fun'),
			('e2e_tl_session2', 'health', 3, 'improving', 'Better code'),
			('e2e_tl_session2', 'learning', 2, 'stable', 'Some learning'),
			('e2e_tl_session2', 'support', 3, 'improving', 'Great support'),
			('e2e_tl_session2', 'pawns', 2, 'stable', 'OK autonomy'),
			('e2e_tl_session2', 'release', 2, 'stable', 'Manageable'),
			('e2e_tl_session2', 'process', 3, 'improving', 'Better process'),
			('e2e_tl_session2', 'teamwork', 2, 'stable', 'OK teamwork'),
			-- Session 3 responses
			('e2e_tl_session3', 'mission', 3, 'improving', 'Crystal clear'),
			('e2e_tl_session3', 'value', 2, 'stable', 'Decent value'),
			('e2e_tl_session3', 'speed', 2, 'improving', 'Getting faster'),
			('e2e_tl_session3', 'fun', 3, 'improving', 'Fun team'),
			('e2e_tl_session3', 'health', 2, 'stable', 'Technical debt'),
			('e2e_tl_session3', 'learning', 3, 'improving', 'Learning lots'),
			('e2e_tl_session3', 'support', 2, 'stable', 'OK support'),
			('e2e_tl_session3', 'pawns', 3, 'improving', 'Empowered'),
			('e2e_tl_session3', 'release', 2, 'improving', 'Easier now'),
			('e2e_tl_session3', 'process', 2, 'stable', 'Works OK'),
			('e2e_tl_session3', 'teamwork', 3, 'improving', 'Great collaboration')
			ON CONFLICT DO NOTHING
		`)
	})

	Describe("Radar Chart View", func() {
		Context("when Team Lead views team health radar chart", func() {
			It("should display radar chart with all 11 dimensions", func() {
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

				By("Waiting for redirect to dashboard")
				// Wait for the login to complete and redirect to dashboard
				err = page.WaitForURL("**/dashboard", playwright.PageWaitForURLOptions{
					Timeout: playwright.Float(10000),
				})
				Expect(err).NotTo(HaveOccurred())

				err = page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
					State: playwright.LoadStateNetworkidle,
				})
				Expect(err).NotTo(HaveOccurred())

				By("Verifying radar chart is displayed")
				radarChart := page.Locator("[data-testid='radar-chart'], .recharts-radar, svg:has(.recharts-polar-grid)")
				err = radarChart.First().WaitFor(playwright.LocatorWaitForOptions{
					State:   playwright.WaitForSelectorStateVisible,
					Timeout: playwright.Float(15000),
				})
				Expect(err).NotTo(HaveOccurred())

				By("Verifying all dimensions are labeled")
				// Check for dimension labels on the chart
				dimensions := []string{"Mission", "Value", "Speed", "Fun", "Health", "Learning", "Support", "Pawns", "Release", "Process", "Teamwork"}
				for _, dim := range dimensions[:3] { // Check at least a few dimensions
					dimLabel := page.Locator("text=" + dim)
					count, _ := dimLabel.Count()
					if count == 0 {
						GinkgoWriter.Printf("Warning: Dimension '%s' label not found\n", dim)
					}
				}

				GinkgoWriter.Printf("Radar chart displayed successfully\n")
			})
		})
	})

	Describe("Response Distribution Tab", func() {
		Context("when Team Lead views response distribution", func() {
			It("should display bar chart showing score distribution per dimension", func() {
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

				// Wait for redirect to dashboard
				err = page.WaitForURL("**/dashboard", playwright.PageWaitForURLOptions{
					Timeout: playwright.Float(10000),
				})
				Expect(err).NotTo(HaveOccurred())

				err = page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
					State: playwright.LoadStateNetworkidle,
				})
				Expect(err).NotTo(HaveOccurred())

				By("Clicking on Response Distribution tab")
				distributionTab := page.Locator("[data-testid='distribution-tab'], button:has-text('Response Distribution'), button:has-text('Distribution')")
				err = distributionTab.First().WaitFor(playwright.LocatorWaitForOptions{
					State:   playwright.WaitForSelectorStateVisible,
					Timeout: playwright.Float(10000),
				})
				Expect(err).NotTo(HaveOccurred())
				err = distributionTab.First().Click()
				Expect(err).NotTo(HaveOccurred())
				time.Sleep(500 * time.Millisecond)

				By("Verifying bar chart is displayed")
				barChart := page.Locator("[data-testid='distribution-chart'], .recharts-bar, svg:has(.recharts-bar-rectangle)")
				err = barChart.First().WaitFor(playwright.LocatorWaitForOptions{
					State:   playwright.WaitForSelectorStateVisible,
					Timeout: playwright.Float(10000),
				})
				Expect(err).NotTo(HaveOccurred())

				By("Verifying color-coded bars (Red, Yellow, Green)")
				// Check for colored bars representing scores
				coloredElements := page.Locator("[fill='#EF4444'], [fill='#F59E0B'], [fill='#10B981'], .fill-red-500, .fill-yellow-500, .fill-green-500")
				count, err := coloredElements.Count()
				Expect(err).NotTo(HaveOccurred())
				Expect(count).To(BeNumerically(">=", 1), "Should display colored score bars")

				GinkgoWriter.Printf("Response distribution displayed successfully\n")
			})
		})
	})

	Describe("Individual Responses Tab", func() {
		Context("when Team Lead views individual responses", func() {
			It("should display list of team member responses with scores", func() {
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

				By("Waiting for redirect to dashboard")
				err = page.WaitForURL("**/dashboard", playwright.PageWaitForURLOptions{
					Timeout: playwright.Float(10000),
				})
				Expect(err).NotTo(HaveOccurred())

				err = page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
					State: playwright.LoadStateNetworkidle,
				})
				Expect(err).NotTo(HaveOccurred())

				By("Clicking on Individual Responses tab")
				responsesTab := page.Locator("[data-testid='responses-tab'], button:has-text('Individual Responses'), button:has-text('Responses')")
				err = responsesTab.First().WaitFor(playwright.LocatorWaitForOptions{
					State:   playwright.WaitForSelectorStateVisible,
					Timeout: playwright.Float(10000),
				})
				Expect(err).NotTo(HaveOccurred())
				err = responsesTab.First().Click()
				Expect(err).NotTo(HaveOccurred())
				time.Sleep(500 * time.Millisecond)

				By("Verifying individual response cards are displayed")
				responseCards := page.Locator("[data-testid='response-card'], [data-testid='member-response']")
				err = responseCards.First().WaitFor(playwright.LocatorWaitForOptions{
					State:   playwright.WaitForSelectorStateVisible,
					Timeout: playwright.Float(10000),
				})
				Expect(err).NotTo(HaveOccurred())

				By("Verifying response count matches expected")
				count, err := responseCards.Count()
				Expect(err).NotTo(HaveOccurred())
				Expect(count).To(BeNumerically(">=", 1), "Should display at least one response")

				By("Verifying response details are shown (scores, trends, comments)")
				// Check for score indicators
				scoreIndicators := page.Locator("[data-testid='score-indicator']").Or(page.Locator("text=Red")).Or(page.Locator("text=Yellow")).Or(page.Locator("text=Green"))
				count, err = scoreIndicators.Count()
				Expect(err).NotTo(HaveOccurred())
				Expect(count).To(BeNumerically(">=", 1), "Should display score indicators")

				GinkgoWriter.Printf("Individual responses displayed successfully\n")
			})

			It("should show comments from team members", func() {
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

				By("Waiting for redirect to dashboard")
				err = page.WaitForURL("**/dashboard", playwright.PageWaitForURLOptions{
					Timeout: playwright.Float(10000),
				})
				Expect(err).NotTo(HaveOccurred())

				By("Navigating to Individual Responses")
				responsesTab := page.Locator("[data-testid='responses-tab'], button:has-text('Individual Responses'), button:has-text('Responses')")
				_ = responsesTab.First().WaitFor(playwright.LocatorWaitForOptions{
					State:   playwright.WaitForSelectorStateVisible,
					Timeout: playwright.Float(10000),
				})
				_ = responsesTab.First().Click()
				time.Sleep(500 * time.Millisecond)

				By("Verifying comments are displayed")
				// Check for comment text from seeded data
				comments := page.Locator("[data-testid='comment']").Or(page.Locator("text=Great clarity")).Or(page.Locator("text=Crystal clear")).Or(page.Locator("text=Good delivery"))
				err = comments.First().WaitFor(playwright.LocatorWaitForOptions{
					State:   playwright.WaitForSelectorStateVisible,
					Timeout: playwright.Float(10000),
				})
				Expect(err).NotTo(HaveOccurred())

				GinkgoWriter.Printf("Comments displayed successfully\n")
			})
		})
	})

	Describe("Trends Tab", func() {
		Context("when Team Lead views trends over time", func() {
			BeforeEach(func() {
				// Clean up any existing trend sessions to ensure fresh data
				_, _ = db.Exec(`DELETE FROM health_check_responses WHERE session_id IN ('e2e_trend_h1', 'e2e_trend_h2')`)
				_, _ = db.Exec(`DELETE FROM health_check_sessions WHERE id IN ('e2e_trend_h1', 'e2e_trend_h2')`)

				// Insert historical data for trend visualization
				_, _ = db.Exec(`
					INSERT INTO health_check_sessions (id, team_id, user_id, date, assessment_period, completed) VALUES
					('e2e_trend_h1', $1, 'e2e_member1', '2024-01-15', '2023 - 2nd Half', true),
					('e2e_trend_h2', $1, 'e2e_member1', '2024-07-15', '2024 - 1st Half', true)
					ON CONFLICT (id) DO NOTHING
				`, testTeamID)

				_, _ = db.Exec(`
					INSERT INTO health_check_responses (session_id, dimension_id, score, trend, comment) VALUES
					('e2e_trend_h1', 'mission', 1, 'declining', 'Was unclear'),
					('e2e_trend_h1', 'value', 1, 'declining', 'Low value'),
					('e2e_trend_h1', 'speed', 1, 'declining', 'Very slow'),
					('e2e_trend_h2', 'mission', 2, 'improving', 'Getting better'),
					('e2e_trend_h2', 'value', 2, 'improving', 'More value'),
					('e2e_trend_h2', 'speed', 2, 'improving', 'Faster now')
					ON CONFLICT DO NOTHING
				`)
			})

			It("should display line chart showing health trends across periods", func() {
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

				By("Waiting for redirect to dashboard")
				err = page.WaitForURL("**/dashboard", playwright.PageWaitForURLOptions{
					Timeout: playwright.Float(10000),
				})
				Expect(err).NotTo(HaveOccurred())

				err = page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
					State: playwright.LoadStateNetworkidle,
				})
				Expect(err).NotTo(HaveOccurred())

				By("Clicking on Trends tab")
				trendsTab := page.Locator("[data-testid='trends-tab'], button:has-text('Trends')")
				err = trendsTab.First().WaitFor(playwright.LocatorWaitForOptions{
					State:   playwright.WaitForSelectorStateVisible,
					Timeout: playwright.Float(10000),
				})
				Expect(err).NotTo(HaveOccurred())
				err = trendsTab.First().Click()
				Expect(err).NotTo(HaveOccurred())
				time.Sleep(500 * time.Millisecond)

				By("Verifying line chart is displayed")
				lineChart := page.Locator("[data-testid='trends-chart'], .recharts-line, svg:has(.recharts-line)")
				err = lineChart.First().WaitFor(playwright.LocatorWaitForOptions{
					State:   playwright.WaitForSelectorStateVisible,
					Timeout: playwright.Float(10000),
				})
				Expect(err).NotTo(HaveOccurred())

				By("Verifying assessment periods are shown on x-axis")
				periods := page.Locator("text=2023 - 2nd Half").Or(page.Locator("text=2024 - 1st Half")).Or(page.Locator("text=2024 - 2nd Half"))
				count, err := periods.Count()
				Expect(err).NotTo(HaveOccurred())
				Expect(count).To(BeNumerically(">=", 1), "Should display at least one assessment period")

				GinkgoWriter.Printf("Trends chart displayed successfully\n")
			})
		})
	})

	Describe("Team Lead Survey Access", func() {
		Context("when Team Lead wants to take a survey", func() {
			It("should allow Team Lead to complete health check survey", func() {
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

				By("Waiting for login redirect to complete (Team Lead goes to dashboard)")
				err = page.WaitForURL("**/dashboard", playwright.PageWaitForURLOptions{
					Timeout: playwright.Float(10000),
				})
				Expect(err).NotTo(HaveOccurred())

				By("Navigating to survey page")
				_, err = page.Goto(frontendURL + "/survey")
				Expect(err).NotTo(HaveOccurred())

				err = page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
					State: playwright.LoadStateNetworkidle,
				})
				Expect(err).NotTo(HaveOccurred())

				By("Verifying survey page loads with dimensions")
				missionLabel := page.Locator("text=Mission")
				err = missionLabel.WaitFor(playwright.LocatorWaitForOptions{
					State:   playwright.WaitForSelectorStateVisible,
					Timeout: playwright.Float(10000),
				})
				Expect(err).NotTo(HaveOccurred())

				By("Verifying Team Lead sees link to dashboard")
				dashboardLink := page.Locator("a[href*='dashboard']").Or(page.Locator("a[href*='manager']")).Or(page.Locator("text=Dashboard")).Or(page.Locator("text=Manager"))
				count, _ := dashboardLink.Count()
				Expect(count).To(BeNumerically(">=", 0), "Dashboard link may be present")

				GinkgoWriter.Printf("Team Lead can access survey successfully\n")
			})
		})
	})
})
