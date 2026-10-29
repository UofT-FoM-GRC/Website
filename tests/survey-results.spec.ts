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

test('every results section has the same shape, and each bar matches the figure beside it', async ({ page }) => {
	await page.goto(resultsRoute)
	const sections = page.locator('[data-survey-section]')
	await expect(sections).toHaveCount(6)
	for (const section of await sections.all()) {
		await expect(section.getByRole('heading', { level: 2 })).toHaveCount(1)
		expect(await section.locator('[data-finding]').count()).toBeGreaterThan(0)
	}

	// A bar is drawn only for a share of respondents, and its length is the figure shown in the same row.
	for (const row of await page.locator('[data-finding]:has([data-bar])').all()) {
		const percent = await row.locator('[data-bar]').getAttribute('data-bar')
		await expect(row.locator('> span').first()).toHaveText(`${percent}%`)
	}

	// The less-known services lead; the rest open from "See all 10 services".
	const allServices = page.locator('details[data-all-services]')
	await allServices.locator('summary').click()
	await expect(
		page.locator('section[aria-labelledby="resources"] [data-finding]', { hasText: 'Report: Figure 25' })
	).toHaveCount(10)
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
