import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { blogTagSchema, homepageSchema, navigationSchema, siteSchema } from '../src/schemas'

type Link = { label: string; url: string }

type Homepage = {
	hero: { image: string; imageAlt: string; lines: string[] }
}

type Navigation = {
	brand: string
	links: Array<Link & { comingSoon?: boolean }>
	resourcePosition?: number
	resourceLabel: string
	resourceLinks: Array<{ label: string; slug: string }>
}

type Site = {
	title: string
	description: string
	contact: { email: string }
	socialLinks: Array<{ label: string; url: string; network: 'instagram' | 'github' }>
}

const readData = <Value>(path: string): Value =>
	JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as Value

const homepage = readData<Homepage>('../src/data/homepage.json')
const navigation = readData<Navigation>('../src/data/navigation.json')
const site = readData<Site>('../src/data/site.json')

const issuePaths = (result: ReturnType<typeof homepageSchema.safeParse>): string[] =>
	result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'))

const validDestinations = ['https://example.ca/page', '/about', 'mailto:grc@example.ca', 'tel:+14161234567', '#contact']
const invalidDestinations = ['javascript:alert(1)', '//example.ca/about', 'ftp://example.ca/file']

test('homepage hero lines require two to five entries', () => {
	const withLines = (count: number) => ({
		...homepage,
		hero: { ...homepage.hero, lines: Array.from({ length: count }, (_, index) => `Hero line ${index + 1}`) }
	})

	expect(issuePaths(homepageSchema.safeParse(withLines(1)))).toEqual(['hero.lines'])
	expect(homepageSchema.safeParse(withLines(2)).success).toBeTruthy()
	expect(homepageSchema.safeParse(withLines(5)).success).toBeTruthy()
	expect(issuePaths(homepageSchema.safeParse(withLines(6)))).toEqual(['hero.lines'])
})

test('navigation links accept internal, https, mail, telephone, and fragment destinations', () => {
	for (const url of validDestinations) {
		expect(navigationSchema.safeParse({ ...navigation, links: [{ label: 'Example', url }] }).success, url).toBeTruthy()
	}
	for (const url of invalidDestinations) {
		expect(navigationSchema.safeParse({ ...navigation, links: [{ label: 'Example', url }] }).success, url).toBeFalsy()
	}
})

test('site settings reject an invalid contact email', () => {
	expect(siteSchema.safeParse(site).success).toBeTruthy()
	for (const email of ['grc.facmed', 'grc@utoronto', 'grc@utoronto.', 'not an email', '@utoronto.ca']) {
		const rejected = siteSchema.safeParse({ ...site, contact: { email } })
		expect(rejected.success, email).toBeFalsy()
		if (!rejected.success) {
			expect(rejected.error.issues.some((issue) => issue.path.join('.') === 'contact.email')).toBeTruthy()
		}
	}
})

test('resource navigation covers every fixed resource page exactly once', () => {
	expect(navigationSchema.safeParse(navigation).success).toBeTruthy()

	const slugs = navigation.resourceLinks.map(({ slug }) => slug)
	expect(slugs).toHaveLength(blogTagSchema.options.length)
	expect(new Set(slugs).size).toBe(blogTagSchema.options.length)
	expect([...slugs].sort()).toEqual([...blogTagSchema.options].sort())

	const duplicated = navigation.resourceLinks.map((link, index) =>
		index === 0 ? { ...link, slug: navigation.resourceLinks[1].slug } : link
	)
	const rejected = navigationSchema.safeParse({ ...navigation, resourceLinks: duplicated })
	expect(rejected.success).toBeFalsy()
	if (!rejected.success) {
		expect(rejected.error.issues).toContainEqual(
			expect.objectContaining({ path: ['resourceLinks'], message: 'Each resource page must appear once.' })
		)
	}
})

test('homepage hero renders the second stored line as the only page heading', async ({ page }) => {
	await page.goto('/')
	const hero = page.locator('main > section').first()
	const heading = page.locator('h1')
	await expect(heading).toHaveText(homepage.hero.lines[1])

	for (const [index, line] of homepage.hero.lines.entries()) {
		if (index === 1) continue
		await expect(hero.getByText(line, { exact: true })).toBeVisible()
	}
	await expect(hero.getByRole('img', { name: homepage.hero.imageAlt, exact: true })).toHaveCount(1)
})

test('homepage is one full-screen hero between the header and footer, light in light theme and blue in dark theme', async ({
	page
}) => {
	const viewport = { width: 1280, height: 900 }
	await page.setViewportSize(viewport)
	await page.goto('/')

	await expect(page.locator('main > section')).toHaveCount(1)
	await expect(page.locator('main h2')).toHaveCount(0)
	const headerBox = await page.locator('header').first().boundingBox()
	const heroBox = await page.locator('main > section').boundingBox()
	expect(heroBox!.height).toBeGreaterThanOrEqual(viewport.height - headerBox!.height - 1)
	await expect(page.locator('footer')).toContainText('Graduate Representation Committee. All rights reserved.')

	const hero = page.locator('main > section')
	for (const link of site.socialLinks) {
		await expect(hero.getByRole('link', { name: link.label, exact: true })).toHaveAttribute('href', link.url)
	}
	await expect(hero.getByRole('link', { name: 'Email the GRC', exact: true })).toHaveAttribute(
		'href',
		`mailto:${site.contact.email}`
	)

	// Light theme: navy text on a light wash. Dark theme: white text on a blue tint.
	await expect(page.locator('h1')).toHaveCSS('color', 'rgb(30, 55, 101)')
	await page.evaluate(() => localStorage.setItem('grc-theme', 'dark'))
	await page.reload()
	await expect(page.locator('h1')).toHaveCSS('color', 'rgb(255, 255, 255)')

	// With no saved choice the site stays light, even on a device set to dark; the top-bar switch changes it and is remembered.
	await page.evaluate(() => localStorage.removeItem('grc-theme'))
	await page.emulateMedia({ colorScheme: 'dark' })
	await page.reload()
	await expect(page.locator('h1')).toHaveCSS('color', 'rgb(30, 55, 101)')
	const toggle = page.locator('header').getByRole('button', { name: 'Toggle dark mode' }).filter({ visible: true })
	await toggle.click()
	await expect(page.locator('h1')).toHaveCSS('color', 'rgb(255, 255, 255)')
	await page.reload()
	await expect(page.locator('h1')).toHaveCSS('color', 'rgb(255, 255, 255)')
	await page.locator('header').getByRole('button', { name: 'Toggle dark mode' }).filter({ visible: true }).click()
	await expect(page.locator('h1')).toHaveCSS('color', 'rgb(30, 55, 101)')
})

test('header renders stored navigation with a plain Resources link and a theme switch, and carries no contact icons', async ({
	page
}) => {
	await page.setViewportSize({ width: 1280, height: 900 })
	await page.goto('/')

	const nav = page.getByRole('navigation', { name: 'Main navigation' })
	const desktopItems = nav.locator(':scope > div.lg\\:flex > *')
	const expectedOrder = navigation.links.map(({ label }) => label)
	expectedOrder.splice(navigation.resourcePosition ?? navigation.links.length, 0, navigation.resourceLabel)
	const shownOrder = (await desktopItems.allInnerTexts()).map((text) => text.replace(/\s+/g, ' ').trim())
	expect(shownOrder.slice(0, expectedOrder.length).map((text) => text.replace(/ coming soon$/i, ''))).toEqual(
		expectedOrder.map((label) => label.toUpperCase())
	)
	for (const link of navigation.links) {
		if (link.comingSoon) {
			// A coming-soon page shows its label and a "Soon" tag, but no link.
			await expect(nav.getByRole('link', { name: link.label, exact: true })).toHaveCount(0)
			await expect(nav.locator('[data-coming-soon]', { hasText: link.label }).filter({ visible: true })).toContainText(
				'Soon'
			)
		} else {
			await expect(nav.getByRole('link', { name: link.label, exact: true }).first()).toHaveAttribute('href', link.url)
		}
	}

	// Resources is a plain link to the Resources page, which lists every topic.
	await expect(nav.getByRole('link', { name: navigation.resourceLabel, exact: true }).first()).toHaveAttribute(
		'href',
		'/resources'
	)
	await expect(nav.locator('#resources-menu')).toHaveCount(0)

	// The top bar keeps only the brand, the page links and search on every page; the footer keeps only the copyright line.
	for (const route of ['/', '/about/']) {
		await page.goto(route)
		const header = page.locator('header')
		await expect(header.getByRole('link', { name: 'Email the GRC', exact: true })).toHaveCount(0)
		for (const link of site.socialLinks) {
			await expect(header.getByRole('link', { name: link.label, exact: true })).toHaveCount(0)
		}
		await expect(header.getByRole('button', { name: 'Toggle dark mode' }).filter({ visible: true })).toHaveCount(1)
		await expect(header.getByRole('button', { name: 'Open search' }).first()).toBeVisible()
		await expect(page.locator('footer').getByRole('link')).toHaveCount(0)
		await expect(page.locator('footer')).toContainText('All rights reserved.')
	}
})
