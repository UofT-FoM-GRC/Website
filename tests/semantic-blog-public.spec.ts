import { expect, test } from '@playwright/test'
import { blogMigration } from './fixtures/blog-migration'

const routeFor = (file: string) => `/blog/${file.replace(/\.md$/, '')}/`
const normalizeTypography = (text: string) => text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"')

test('every migrated route renders semantic callouts, images, and actions without legacy presentation markup', async ({
	page
}) => {
	const renderedKinds = new Set<string>()

	for (const migration of blogMigration) {
		await page.goto(routeFor(migration.file))
		const callouts = page.locator('aside.semantic-callout')
		await expect(callouts, migration.file).toHaveCount(migration.callouts.length)
		for (const [index, expected] of migration.callouts.entries()) {
			const callout = callouts.nth(index)
			renderedKinds.add(expected.kind)
			await expect(callout).toHaveAttribute('data-callout-kind', expected.kind)
			await expect(
				callout.getByText(expected.kind[0].toUpperCase() + expected.kind.slice(1), { exact: true })
			).toBeVisible()
			await expect(callout.locator('.semantic-callout__icon')).toHaveAttribute('aria-hidden', 'true')
			for (const fact of expected.facts) {
				expect(normalizeTypography((await callout.textContent()) ?? '')).toContain(normalizeTypography(fact))
			}
			if (expected.listItems) await expect(callout.locator('ul > li')).toHaveText(expected.listItems)
		}
		for (const image of migration.images ?? []) {
			await expect(page.getByRole('img', { name: image.description, exact: true })).toHaveAttribute('src', image.src)
		}
		for (const action of migration.actionLinks ?? []) {
			await expect(
				page.locator('.semantic-action-link').getByRole('link', { name: action.label, exact: true })
			).toHaveAttribute('href', action.url)
		}
		await expect(
			page.locator(
				'main article [class*="bg-green-100"], main article [class*="bg-blue-100"], main article [class*="bg-yellow-100"], main article [class*="bg-purple-100"], main article [style]'
			)
		).toHaveCount(0)
		await expect(page.locator('main article aside.semantic-callout svg')).toHaveCount(0)
	}

	expect([...renderedKinds].sort()).toEqual(['important', 'information', 'warning'])
})

test('pilot Zoom post renders labelled semantic callouts and an accessible Markdown image', async ({ page }) => {
	await page.goto('/blog/uoft-zoom-pro/')
	const callouts = page.locator('aside.semantic-callout')
	await expect(callouts).toHaveCount(4)
	await expect(callouts.nth(0)).toHaveAttribute('data-callout-kind', 'information')
	await expect(callouts.nth(2)).toHaveAttribute('data-callout-kind', 'important')
	await expect(callouts.nth(0).getByText('Information', { exact: true })).toBeVisible()
	await expect(callouts.nth(2).getByText('Important', { exact: true })).toBeVisible()
	await expect(callouts.nth(0).locator('.semantic-callout__icon')).toHaveAttribute('aria-hidden', 'true')
	await expect(page.getByRole('img', { name: 'Zoom SSO', exact: true })).toHaveAttribute('src', '/assets/zoom-sso.webp')
})

test('pilot action link stays keyboard-focusable and semantic blocks adapt across themes and narrow screens', async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 844 })
	await page.emulateMedia({ reducedMotion: 'reduce' })
	await page.addInitScript(() => localStorage.setItem('grc-theme', 'dark'))
	await page.goto('/blog/robarts-family-study-space/')

	const action = page.locator('.semantic-action-link')
	const link = action.getByRole('link', {
		name: 'Register using this form to get your key-fob for access to the space'
	})
	await expect(action).toBeVisible()
	await expect(link).toHaveAttribute('href', /^http:\/\/can01\.safelinks\.protection\.outlook\.com\//)
	await link.focus()
	await expect(link).toBeFocused()
	await expect(action).toHaveCSS('background-color', 'rgb(23, 37, 84)')
	expect(
		await action.evaluate((element) => element.getBoundingClientRect().right <= window.innerWidth + 1)
	).toBeTruthy()
	await expect(link).toHaveCSS('transition-duration', '1e-05s')
})
