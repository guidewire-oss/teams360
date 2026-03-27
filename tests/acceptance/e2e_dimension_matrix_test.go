package acceptance_test

import (
	"time"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/playwright-community/playwright-go"
)

var _ = Describe("E2E: Dimension Matrix View", Label("e2e"), func() {
	var (
		page        playwright.Page
		matrixTeam  = "e2e_matrix_team"
		matrixLead  = "e2e_matrix_lead"
	)

	BeforeEach(func() {
		// Create an isolated user and team for matrix tests to avoid interference from admin tests
		_, _ = db.Exec(`DELETE FROM health_check_responses WHERE session_id IN ('e2e_matrix_s1', 'e2e_matrix_s2')`)
		_, _ = db.Exec(`DELETE FROM health_check_sessions WHERE id IN ('e2e_matrix_s1', 'e2e_matrix_s2')`)
		_, _ = db.Exec(`DELETE FROM team_members WHERE team_id = $1`, matrixTeam)
		_, _ = db.Exec(`DELETE FROM team_supervisors WHERE team_id = $1`, matrixTeam)
		_, _ = db.Exec(`DELETE FROM teams WHERE id = $1`, matrixTeam)
		_, _ = db.Exec(`DELETE FROM users WHERE id IN ($1, 'e2e_member1', 'e2e_member2')`, matrixLead)

		// Create team lead
		_, err := db.Exec(`
			INSERT INTO users (id, username, email, full_name, hierarchy_level_id, password_hash)
			VALUES ($1, $2, $3, 'E2E Matrix Lead', 'level-4', $4)
			ON CONFLICT (id) DO NOTHING
		`, matrixLead, matrixLead, matrixLead+"@teams360.demo", DemoPasswordHash)
		Expect(err).NotTo(HaveOccurred())

		// Create team members
		_, err = db.Exec(`
			INSERT INTO users (id, username, email, full_name, hierarchy_level_id, password_hash) VALUES
			('e2e_member1', 'e2e_member1', 'e2e_member1@teams360.demo', 'E2E Member 1', 'level-5', $1),
			('e2e_member2', 'e2e_member2', 'e2e_member2@teams360.demo', 'E2E Member 2', 'level-5', $1)
			ON CONFLICT (id) DO NOTHING
		`, DemoPasswordHash)
		Expect(err).NotTo(HaveOccurred())

		// Create team
		_, err = db.Exec(`
			INSERT INTO teams (id, name, team_lead_id)
			VALUES ($1, 'E2E Matrix Team', $2)
			ON CONFLICT (id) DO NOTHING
		`, matrixTeam, matrixLead)
		Expect(err).NotTo(HaveOccurred())

		// Add members to team
		_, err = db.Exec(`
			INSERT INTO team_members (team_id, user_id) VALUES
			($1, 'e2e_member1'),
			($1, 'e2e_member2')
			ON CONFLICT DO NOTHING
		`, matrixTeam)
		Expect(err).NotTo(HaveOccurred())

		_, err = db.Exec(`
			INSERT INTO health_check_sessions (id, team_id, user_id, date, assessment_period, completed) VALUES
			('e2e_matrix_s1', $1, 'e2e_member1', '2024-10-01', '2024 - 2nd Half', true),
			('e2e_matrix_s2', $1, 'e2e_member2', '2024-10-02', '2024 - 2nd Half', true)
			ON CONFLICT (id) DO NOTHING
		`, matrixTeam)
		Expect(err).NotTo(HaveOccurred())

		_, err = db.Exec(`
			INSERT INTO health_check_responses (session_id, dimension_id, score, trend, comment) VALUES
			('e2e_matrix_s1', 'mission', 3, 'improving', 'Great clarity'),
			('e2e_matrix_s1', 'value', 2, 'stable', ''),
			('e2e_matrix_s1', 'speed', 1, 'declining', 'Too slow'),
			('e2e_matrix_s1', 'fun', 3, 'improving', 'Enjoying work'),
			('e2e_matrix_s1', 'health', 2, 'stable', ''),
			('e2e_matrix_s1', 'learning', 3, 'improving', ''),
			('e2e_matrix_s1', 'support', 2, 'stable', ''),
			('e2e_matrix_s1', 'pawns', 3, 'improving', ''),
			('e2e_matrix_s1', 'release', 1, 'declining', ''),
			('e2e_matrix_s1', 'process', 2, 'stable', ''),
			('e2e_matrix_s1', 'teamwork', 3, 'improving', ''),
			('e2e_matrix_s2', 'mission', 2, 'stable', ''),
			('e2e_matrix_s2', 'value', 3, 'improving', 'Great value'),
			('e2e_matrix_s2', 'speed', 2, 'stable', ''),
			('e2e_matrix_s2', 'fun', 2, 'declining', 'Less fun lately'),
			('e2e_matrix_s2', 'health', 3, 'improving', ''),
			('e2e_matrix_s2', 'learning', 2, 'stable', ''),
			('e2e_matrix_s2', 'support', 3, 'improving', ''),
			('e2e_matrix_s2', 'pawns', 2, 'stable', ''),
			('e2e_matrix_s2', 'release', 2, 'stable', ''),
			('e2e_matrix_s2', 'process', 3, 'improving', ''),
			('e2e_matrix_s2', 'teamwork', 2, 'stable', '')
			ON CONFLICT DO NOTHING
		`)
		Expect(err).NotTo(HaveOccurred())

		var err2 error
		page, err2 = browser.NewPage()
		Expect(err2).NotTo(HaveOccurred())
	})

	AfterEach(func() {
		_, _ = db.Exec(`DELETE FROM health_check_responses WHERE session_id IN ('e2e_matrix_s1', 'e2e_matrix_s2')`)
		_, _ = db.Exec(`DELETE FROM health_check_sessions WHERE id IN ('e2e_matrix_s1', 'e2e_matrix_s2')`)
		_, _ = db.Exec(`DELETE FROM team_members WHERE team_id = $1`, matrixTeam)
		_, _ = db.Exec(`DELETE FROM team_supervisors WHERE team_id = $1`, matrixTeam)
		_, _ = db.Exec(`DELETE FROM teams WHERE id = $1`, matrixTeam)
		_, _ = db.Exec(`DELETE FROM users WHERE id IN ($1, 'e2e_member1', 'e2e_member2')`, matrixLead)
		if page != nil {
			page.Close()
		}
	})

	loginAndGoToResponses := func() {
		By("Logging in as matrix test lead")
		_, err := page.Goto(frontendURL + "/login")
		Expect(err).NotTo(HaveOccurred())

		err = page.Locator("input[name='username']").WaitFor(playwright.LocatorWaitForOptions{
			State:   playwright.WaitForSelectorStateVisible,
			Timeout: playwright.Float(10000),
		})
		Expect(err).NotTo(HaveOccurred())

		err = page.Locator("input[name='username']").Fill(matrixLead)
		Expect(err).NotTo(HaveOccurred())
		err = page.Locator("input[name='password']").Fill("demo")
		Expect(err).NotTo(HaveOccurred())
		err = page.Locator("button[type='submit']").Click()
		Expect(err).NotTo(HaveOccurred())

		By("Waiting for dashboard to load")
		Eventually(func() string {
			return page.URL()
		}, 10*time.Second, 500*time.Millisecond).Should(ContainSubstring("/dashboard"))

		By("Clicking Individual Responses tab")
		responsesTab := page.Locator("[data-testid='responses-tab']")
		err = responsesTab.WaitFor(playwright.LocatorWaitForOptions{
			State:   playwright.WaitForSelectorStateVisible,
			Timeout: playwright.Float(10000),
		})
		Expect(err).NotTo(HaveOccurred())
		err = responsesTab.Click()
		Expect(err).NotTo(HaveOccurred())

		By("Waiting for responses section")
		err = page.Locator("[data-testid='responses-section']").WaitFor(playwright.LocatorWaitForOptions{
			State:   playwright.WaitForSelectorStateVisible,
			Timeout: playwright.Float(5000),
		})
		Expect(err).NotTo(HaveOccurred())
	}

	Describe("Dimension matrix toggle", func() {
		It("should toggle between person and dimension views", func() {
			loginAndGoToResponses()

			By("Verifying matrix table is visible by default")
			matrixTable := page.Locator("table")
			Eventually(func() bool {
				visible, _ := matrixTable.IsVisible()
				return visible
			}, 5*time.Second, 500*time.Millisecond).Should(BeTrue())

			By("Verifying Matrix button is active (default view)")
			// The Matrix button should have the active class (text-indigo-600)
			matrixBtn := page.Locator("[data-testid='matrix-view-btn']")
			err := matrixBtn.WaitFor(playwright.LocatorWaitForOptions{
				State:   playwright.WaitForSelectorStateVisible,
				Timeout: playwright.Float(5000),
			})
			Expect(err).NotTo(HaveOccurred())

			matrixClass, err := matrixBtn.GetAttribute("class")
			Expect(err).NotTo(HaveOccurred())
			Expect(matrixClass).To(ContainSubstring("text-indigo-600"))

			By("Clicking Cards button to switch view")
			cardsBtn := page.Locator("[data-testid='cards-view-btn']")
			err = cardsBtn.Click()
			Expect(err).NotTo(HaveOccurred())

			By("Verifying response cards are visible (cards view)")
			cards := page.Locator("[data-testid='response-card']")
			Eventually(func() int {
				count, _ := cards.Count()
				return count
			}, 5*time.Second, 500*time.Millisecond).Should(BeNumerically(">", 0))

			By("Verifying matrix table is hidden in cards view")
			Eventually(func() bool {
				visible, _ := matrixTable.IsVisible()
				return !visible
			}, 3*time.Second, 300*time.Millisecond).Should(BeTrue())

			By("Switching back to matrix view")
			err = matrixBtn.Click()
			Expect(err).NotTo(HaveOccurred())

			Eventually(func() bool {
				visible, _ := matrixTable.IsVisible()
				return visible
			}, 3*time.Second, 300*time.Millisecond).Should(BeTrue())
		})
	})

	Describe("Matrix cell content", func() {
		It("should display score boxes with color coding and trend arrows", func() {
			loginAndGoToResponses()

			// Matrix is default view, no need to switch
			By("Verifying matrix is visible by default")
			matrixTable := page.Locator("table")
			err := matrixTable.WaitFor(playwright.LocatorWaitForOptions{
				State:   playwright.WaitForSelectorStateVisible,
				Timeout: playwright.Float(5000),
			})
			Expect(err).NotTo(HaveOccurred())

			By("Verifying score cell for e2e_member1 - mission (Green, Improving)")
			scoreEl := page.Locator("[data-testid='matrix-score-e2e_matrix_s1-mission']")
			err = scoreEl.WaitFor(playwright.LocatorWaitForOptions{
				State:   playwright.WaitForSelectorStateVisible,
				Timeout: playwright.Float(5000),
			})
			Expect(err).NotTo(HaveOccurred())

			scoreText, err := scoreEl.TextContent()
			Expect(err).NotTo(HaveOccurred())
			Expect(scoreText).To(Equal("G"))

			scoreClass, err := scoreEl.GetAttribute("class")
			Expect(err).NotTo(HaveOccurred())
			Expect(scoreClass).To(ContainSubstring("bg-green-500"))

			trendEl := page.Locator("[data-testid='matrix-trend-e2e_matrix_s1-mission']")
			trendText, err := trendEl.TextContent()
			Expect(err).NotTo(HaveOccurred())
			Expect(trendText).To(Equal("↑"))

			By("Verifying score cell for e2e_member1 - speed (Red, Declining)")
			speedScore := page.Locator("[data-testid='matrix-score-e2e_matrix_s1-speed']")
			speedText, err := speedScore.TextContent()
			Expect(err).NotTo(HaveOccurred())
			Expect(speedText).To(Equal("R"))

			speedClass, err := speedScore.GetAttribute("class")
			Expect(err).NotTo(HaveOccurred())
			Expect(speedClass).To(ContainSubstring("bg-red-500"))

			speedTrend := page.Locator("[data-testid='matrix-trend-e2e_matrix_s1-speed']")
			speedTrendText, err := speedTrend.TextContent()
			Expect(err).NotTo(HaveOccurred())
			Expect(speedTrendText).To(Equal("↓"))

			By("Verifying comment indicator for cells with comments")
			commentIndicator := page.Locator("[data-testid='matrix-comment-e2e_matrix_s1-mission']")
			commentVisible, _ := commentIndicator.IsVisible()
			Expect(commentVisible).To(BeTrue())

			By("Verifying no comment indicator for cells without comments")
			noComment := page.Locator("[data-testid='matrix-comment-e2e_matrix_s1-value']")
			noCommentCount, _ := noComment.Count()
			Expect(noCommentCount).To(Equal(0))
		})
	})
})
