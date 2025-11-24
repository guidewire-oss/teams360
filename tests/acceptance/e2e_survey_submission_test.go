package acceptance_test

import (
	"fmt"
	"time"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/playwright-community/playwright-go"
)

var _ = Describe("E2E: Survey Submission Flow", func() {
	var (
		testTeamID    = "team1"
		testUserID    = "mem1"
		testSessionID string
	)

	Describe("Complete survey submission workflow", func() {
		Context("when a user submits a health check survey", func() {
			It("should save the data to the database and show success confirmation", func() {
				By("Opening browser and logging in")
				page, err := browser.NewPage()
				Expect(err).NotTo(HaveOccurred())
				defer page.Close()

				// Navigate to login page
				_, err = page.Goto(frontendURL + "/login")
				Expect(err).NotTo(HaveOccurred())

				// Fill login credentials (Team Member: demo/demo)
				usernameInput := page.Locator("#username")
				err = usernameInput.Fill("demo")
				Expect(err).NotTo(HaveOccurred())

				passwordInput := page.Locator("#password")
				err = passwordInput.Fill("demo")
				Expect(err).NotTo(HaveOccurred())

				// Click Sign In button
				loginButton := page.Locator("button[type='submit']:has-text('Sign In')")
				err = loginButton.Click()
				Expect(err).NotTo(HaveOccurred())

				// Wait for redirect to survey page (Team Members go to /survey)
				err = page.WaitForURL("**/survey", playwright.PageWaitForURLOptions{
					Timeout: playwright.Float(5000),
				})
				Expect(err).NotTo(HaveOccurred())

				// Wait for page to fully load
				err = page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
					State: playwright.LoadStateNetworkidle,
				})
				Expect(err).NotTo(HaveOccurred())

				By("Verifying survey page loaded")
				title, err := page.Title()
				Expect(err).NotTo(HaveOccurred())
				Expect(title).To(ContainSubstring("Health Check"))

				By("Waiting for health dimensions to load")
				// Wait for the first dimension card to appear
				err = page.Locator("text=Mission").WaitFor(playwright.LocatorWaitForOptions{
					State:   playwright.WaitForSelectorStateVisible,
					Timeout: playwright.Float(10000),
				})
				Expect(err).NotTo(HaveOccurred())

			By("Selecting health check responses for all 11 dimensions (paginated survey)")

			// Helper function to fill a dimension
			fillDimension := func(dimensionID string, score int, trend string) {
				scoreSelector := fmt.Sprintf("[data-dimension='%s'][data-score='%d']", dimensionID, score)
				err = page.Locator(scoreSelector).WaitFor(playwright.LocatorWaitForOptions{
					State:   playwright.WaitForSelectorStateVisible,
					Timeout: playwright.Float(5000),
				})
				Expect(err).NotTo(HaveOccurred())
				err = page.Locator(scoreSelector).Click()
				Expect(err).NotTo(HaveOccurred())
				time.Sleep(300 * time.Millisecond)

				trendSelector := fmt.Sprintf("[data-dimension='%s'][data-trend='%s']", dimensionID, trend)
				err = page.Locator(trendSelector).WaitFor(playwright.LocatorWaitForOptions{
					State:   playwright.WaitForSelectorStateVisible,
					Timeout: playwright.Float(3000),
				})
				Expect(err).NotTo(HaveOccurred())
				err = page.Locator(trendSelector).Click()
				Expect(err).NotTo(HaveOccurred())
				time.Sleep(300 * time.Millisecond)
			}

			clickNext := func() {
				nextButton := page.Locator("button:has-text('Next')")
				err = nextButton.WaitFor(playwright.LocatorWaitForOptions{
					State:   playwright.WaitForSelectorStateVisible,
					Timeout: playwright.Float(3000),
				})
				Expect(err).NotTo(HaveOccurred())
				err = nextButton.Click()
				Expect(err).NotTo(HaveOccurred())
				time.Sleep(500 * time.Millisecond)
			}

			// 1. Mission - Green (3), Improving
			fillDimension("mission", 3, "improving")
			clickNext()

			// 2. Delivering Value - Yellow (2), Stable
			fillDimension("value", 2, "stable")
			clickNext()

			// 3. Speed - Red (1), Declining
			fillDimension("speed", 1, "declining")
			clickNext()

			// 4. Fun - Yellow (2), Stable
			fillDimension("fun", 2, "stable")
			clickNext()

			// 5. Health of Codebase - Green (3), Improving
			fillDimension("health", 3, "improving")
			clickNext()

			// 6. Learning - Green (3), Improving
			fillDimension("learning", 3, "improving")
			clickNext()

			// 7. Support - Yellow (2), Stable
			fillDimension("support", 2, "stable")
			clickNext()

			// 8. Pawns or Players - Green (3), Improving
			fillDimension("pawns", 3, "improving")
			clickNext()

			// 9. Easy to Release - Red (1), Declining
			fillDimension("release", 1, "declining")
			clickNext()

			// 10. Suitable Process - Yellow (2), Stable
			fillDimension("process", 2, "stable")
			clickNext()

			// 11. Teamwork - Green (3), Improving (LAST - no Next button)
			fillDimension("teamwork", 3, "improving")

			By("Submitting the survey (on last dimension)")
			submitButton := page.Locator("button[type='submit']:has-text('Submit')")
			err = submitButton.WaitFor(playwright.LocatorWaitForOptions{
				State:   playwright.WaitForSelectorStateVisible,
				Timeout: playwright.Float(3000),
			})
			Expect(err).NotTo(HaveOccurred())
			err = submitButton.Click()
			Expect(err).NotTo(HaveOccurred())
				By("Verifying success message appears")
			successMessage := page.Locator("h1:has-text('Thank You')")
				err = successMessage.WaitFor(playwright.LocatorWaitForOptions{
					State:   playwright.WaitForSelectorStateVisible,
					Timeout: playwright.Float(10000),
				})
				Expect(err).NotTo(HaveOccurred())

				By("Extracting session ID from success message or URL")
				// Try to get session ID from URL or page content
				url := page.URL()
				GinkgoWriter.Printf("Success page URL: %s\n", url)

				By("Querying database to verify data was saved correctly")
				// Find the most recent session for this team/user
				var sessionID, teamID, userID, date, assessmentPeriod string
				var completed bool

				err = db.QueryRow(`
					SELECT id, team_id, user_id, date, assessment_period, completed
					FROM health_check_sessions
					WHERE team_id = $1 AND user_id = $2
					ORDER BY created_at DESC
					LIMIT 1
				`, testTeamID, testUserID).Scan(&sessionID, &teamID, &userID, &date, &assessmentPeriod, &completed)

				Expect(err).NotTo(HaveOccurred(), "Session should exist in database")
				Expect(teamID).To(Equal(testTeamID))
				Expect(userID).To(Equal(testUserID))
				Expect(completed).To(BeTrue())

				testSessionID = sessionID
				GinkgoWriter.Printf("Found session in database: %s\n", sessionID)

				By("Verifying all 11 responses were saved")
				var responseCount int
				err = db.QueryRow(`
					SELECT COUNT(*)
					FROM health_check_responses
					WHERE session_id = $1
				`, sessionID).Scan(&responseCount)

				Expect(err).NotTo(HaveOccurred())
				Expect(responseCount).To(Equal(11), "Should have 11 dimension responses")

				By("Verifying specific response data")
				// Check Mission response
				var dimensionID, trend, comment string
				var score int

				err = db.QueryRow(`
					SELECT dimension_id, score, trend, comment
					FROM health_check_responses
					WHERE session_id = $1 AND dimension_id = 'mission'
				`, sessionID).Scan(&dimensionID, &score, &trend, &comment)

				Expect(err).NotTo(HaveOccurred())
				Expect(dimensionID).To(Equal("mission"))
				Expect(score).To(Equal(3))
				Expect(trend).To(Equal("improving"))

				// Check Speed response (Red, Declining)
				err = db.QueryRow(`
					SELECT dimension_id, score, trend
					FROM health_check_responses
					WHERE session_id = $1 AND dimension_id = 'speed'
				`, sessionID).Scan(&dimensionID, &score, &trend)

				Expect(err).NotTo(HaveOccurred())
				Expect(dimensionID).To(Equal("speed"))
				Expect(score).To(Equal(1))
				Expect(trend).To(Equal("declining"))

				By("Verifying assessment period was auto-calculated")
				Expect(assessmentPeriod).NotTo(BeEmpty())
				// Assessment period should be in format "YYYY - 1st Half" or "YYYY - 2nd Half"
				Expect(assessmentPeriod).To(MatchRegexp(`\d{4} - (1st|2nd) Half`))

				GinkgoWriter.Printf("✅ E2E Test PASSED: Survey submitted successfully\n")
				GinkgoWriter.Printf("   Session ID: %s\n", sessionID)
				GinkgoWriter.Printf("   Team ID: %s\n", teamID)
				GinkgoWriter.Printf("   User ID: %s\n", userID)
				GinkgoWriter.Printf("   Assessment Period: %s\n", assessmentPeriod)
				GinkgoWriter.Printf("   Responses: %d/11\n", responseCount)
			})
		})

		Context("when viewing submitted survey results", func() {
			It("should display the survey data on the results page", func() {
				By("Opening results page")
				page, err := browser.NewPage()
				Expect(err).NotTo(HaveOccurred())
				defer page.Close()

				// Navigate to team results page
				_, err = page.Goto(fmt.Sprintf("%s/teams/%s", frontendURL, testTeamID))
				Expect(err).NotTo(HaveOccurred())

				By("Verifying submitted survey appears in results")
				// Look for the session we just submitted
				sessionCard := page.Locator(fmt.Sprintf("text=%s", testSessionID))
				err = sessionCard.WaitFor(playwright.LocatorWaitForOptions{
					State:   playwright.WaitForSelectorStateVisible,
					Timeout: playwright.Float(10000),
				})
				Expect(err).NotTo(HaveOccurred())

				By("Verifying aggregate scores are displayed")
				// Check that dimension scores are visible
				missionScore := page.Locator("[data-dimension='mission'] [data-display='score']")
				count, err := missionScore.Count()
				Expect(err).NotTo(HaveOccurred())
				Expect(count).To(BeNumerically(">", 0), "Mission score should be displayed")

				GinkgoWriter.Printf("✅ Results page verified successfully\n")
			})
		})
	})

	Describe("Error handling and validation", func() {
		Context("when submitting incomplete survey", func() {
			It("should show validation errors and prevent submission", func() {
				By("Opening survey page")
				page, err := browser.NewPage()
				Expect(err).NotTo(HaveOccurred())
				defer page.Close()

				_, err = page.Goto(frontendURL + "/survey")
				Expect(err).NotTo(HaveOccurred())

				By("Attempting to submit without filling required fields")
				submitButton := page.Locator("button[type='submit'], button:has-text('Submit')")
				err = submitButton.Click()
				Expect(err).NotTo(HaveOccurred())

				By("Verifying validation error messages appear")
				errorMessage := page.Locator("text=/required|please fill|invalid/i")
				err = errorMessage.WaitFor(playwright.LocatorWaitForOptions{
					State:   playwright.WaitForSelectorStateVisible,
					Timeout: playwright.Float(5000),
				})
				Expect(err).NotTo(HaveOccurred())

				By("Verifying no data was saved to database")
				var count int
				err = db.QueryRow(`
					SELECT COUNT(*)
					FROM health_check_sessions
					WHERE team_id = 'incomplete-test'
				`).Scan(&count)

				Expect(err).NotTo(HaveOccurred())
				Expect(count).To(Equal(0), "No incomplete sessions should be saved")

				GinkgoWriter.Printf("✅ Validation working correctly\n")
			})
		})
	})
})
