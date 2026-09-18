import { expect, test } from '@playwright/test'

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
