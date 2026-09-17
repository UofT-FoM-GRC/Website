import { expect, test } from '@playwright/test'
import { isExpired } from '../src/utils/blog'

const keyRoutes = ['/', '/blog/', '/resources/', '/resources/employment/', '/about/']

test('key routes expose one main landmark and one page heading', async ({ page }) => {
	for (const route of keyRoutes) {
		await page.goto(route)
		await expect(page.locator('main')).toHaveCount(1)
		await expect(page.locator('main#main-content')).toHaveCount(1)
		await expect(page.locator('h1')).toHaveCount(1)
	}
})

test('light body has no gradient and footer has no Twitter social links or icons', async ({ page }) => {
	await page.goto('/')
	await expect(page.locator('body')).toHaveCSS('background-image', 'none')
	await expect(
		page.locator(
			'footer a[aria-label*="Twitter" i], footer a[href*="twitter.com" i], footer a[href*="x.com" i], footer [data-icon*="twitter" i]'
		)
	).toHaveCount(0)
})

test('blog metadata provides article social image metadata', async ({ page }) => {
	await page.goto('/blog/biorender-for-students/')
	await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article')
	await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /biorenderlogo/)
	await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', /biorenderlogo/)
	await expect(page.locator('link[type="application/rss+xml"]')).toHaveCount(1)
})

test('archived posts retain URL and warn readers', async ({ page }) => {
	await page.goto('/blog/ims-career-mentorship-2024/')
	await expect(page.getByText('Archived post.')).toBeVisible()
})

test('expiry dates use Toronto calendar days', () => {
	const post = { data: { expiresOn: new Date('2026-08-08T00:00:00.000Z') } } as Parameters<typeof isExpired>[0]
	expect(isExpired(post, new Date('2026-08-09T03:59:59.000Z'))).toBeFalsy()
	expect(isExpired(post, new Date('2026-08-09T04:00:00.000Z'))).toBeTruthy()
})

test('search dialog restores focus and team accordion updates state', async ({ page }) => {
	await page.goto('/')
	const searchButton = page.getByRole('button', { name: 'Open search' }).first()
	await searchButton.click()
	const dialog = page.getByRole('dialog', { name: 'Search this site' })
	await expect(dialog).toBeVisible()
	await expect(page.getByRole('button', { name: 'Close search' })).toBeFocused()
	await expect(page.locator('.pagefind-ui__search-input')).toBeFocused()
	await page.keyboard.press('Escape')
	await expect(dialog).toBeHidden()
	await expect(searchButton).toBeFocused()
	await page.waitForTimeout(600)
	await expect(searchButton).toBeFocused()
	await searchButton.click()
	await expect(page.locator('.pagefind-ui')).toHaveCount(1)
	await page.keyboard.press('Escape')
	await page
		.getByRole('navigation', { name: 'Main navigation' })
		.getByRole('link', { name: 'Blog', exact: true })
		.click()
	await expect(page).toHaveURL(/\/blog\/?$/)
	const transitionedSearchButton = page.getByRole('button', { name: 'Open search' }).first()
	await transitionedSearchButton.click()
	await expect(page.locator('.pagefind-ui__search-input')).toBeFocused()
	await page.keyboard.press('Escape')

	await page.goto('/about/')
	const accordion = page.getByRole('button', { name: '2024 - 2025' })
	await accordion.click()
	await expect(accordion).toHaveAttribute('aria-expanded', 'true')
})
