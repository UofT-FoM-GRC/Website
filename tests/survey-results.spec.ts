import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

const readJson = <T>(path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as T
const navigation = readJson<{ links: { label: string; url: string; comingSoon?: boolean }[] }>(
	'../src/data/navigation.json'
)
const homepage = readJson<{ highlights: { label: string; url?: string; comingSoon?: boolean }[] }>(
	'../src/data/homepage.json'
)

const resultsRoute = '/survey/2025-26/'
const reportUrl = '/reports/2025-26-graduate-student-survey-report.pdf'

test('survey results page leads with the headline numbers and the report download', async ({ page }) => {
	await page.goto(resultsRoute)
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('What 244 graduate students told us')
	await expect(page.locator('section[aria-labelledby="at-a-glance"] [data-stat]').first()).toContainText('73%')
	await expect(page.locator('section[aria-labelledby="at-a-glance"] [data-stat]')).toHaveCount(4)
	await expect(page.locator('a[data-report-link]')).toHaveAttribute('href', reportUrl)

	// Every section in the "On this page" row exists.
	const jumpLinks = page.getByRole('navigation', { name: 'On this page' }).getByRole('link')
	for (const href of await jumpLinks.evaluateAll((links) => links.map((link) => link.getAttribute('href')))) {
		await expect(page.locator(`section[aria-labelledby="${href!.slice(1)}"]`)).toHaveCount(1)
	}
})

test('the report PDF is published', async ({ request }) => {
	const response = await request.get(reportUrl)
	expect(response.ok()).toBeTruthy()
	expect(response.headers()['content-type']).toContain('application/pdf')
})

test('each survey chart has a table view with the same values', async ({ page }) => {
	await page.goto(resultsRoute)
	const expected: Record<string, number> = { 'living-costs-chart': 9, 'insecurity-chart': 3, 'awareness-chart': 10 }
	for (const [id, rows] of Object.entries(expected)) {
		const chart = page.locator(`[data-survey-chart="${id}"]`)
		await expect(chart.getByRole('img')).toHaveAttribute('aria-label', /.+/)
		await chart.locator('summary', { hasText: 'Show as table' }).click()
		await expect(chart.locator('tbody tr')).toHaveCount(rows)
	}
	const livingCosts = page.locator('[data-survey-chart="living-costs-chart"] tbody tr').last()
	await expect(livingCosts).toContainText('2025')
	await expect(livingCosts).toContainText('73%')
})

test('the Survey & Report menu item and the Survey results button open the results page', async ({ page }) => {
	const menuItem = navigation.links.find(({ label }) => label === 'Survey & Report')!
	expect(menuItem.comingSoon ?? false).toBe(false)
	const button = homepage.highlights.find(({ label }) => label === 'Survey results')!
	expect(button.comingSoon).toBe(false)

	await page.goto('/')
	await page.locator('[data-highlights] a', { hasText: 'Survey results' }).click()
	await expect(page).toHaveURL(new RegExp(`${resultsRoute}?$`))

	await page.goto('/about/')
	await page
		.getByRole('navigation', { name: 'Main navigation' })
		.getByRole('link', { name: 'Survey & Report', exact: true })
		.filter({ visible: true })
		.click()
	await expect(page).toHaveURL(new RegExp(`${resultsRoute}?$`))
	await expect(
		page
			.getByRole('navigation', { name: 'Main navigation' })
			.getByRole('link', { name: 'Survey & Report', exact: true })
			.filter({ visible: true })
	).toHaveAttribute('aria-current', 'page')
})

test('/survey forwards to the latest results and the sitemap lists them', async ({ page, request }) => {
	await page.goto('/survey/')
	await expect(page).toHaveURL(new RegExp(`${resultsRoute}?$`))

	const sitemap = await (await request.get('/sitemap-0.xml')).text()
	expect(sitemap).toContain(`https://uoftfomgrc.ca${resultsRoute}`)
})
