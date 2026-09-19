import { expect, test, type Locator, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { blogTagSchema, homepageSchema, navigationSchema, siteSchema } from '../src/schemas'

type Link = { label: string; url: string }

type Homepage = {
	hero: { image: string; imageAlt: string; lines: string[] }
	featureSections: Array<{
		title: string
		paragraphs: string[]
		links: Link[]
		image: string
		imageAlt: string
		tone: 'dark' | 'light'
		imageFirst: boolean
	}>
	contactHeading: string
	contactText: string
}

type Navigation = {
	brand: string
	links: Link[]
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

const featureSection = (page: Page, title: string): Locator =>
	page.locator('main > section').filter({ has: page.getByRole('heading', { level: 2, name: title, exact: true }) })

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

test('navigation and homepage feature links accept internal, https, mail, telephone, and fragment destinations', () => {
	for (const url of validDestinations) {
		expect(navigationSchema.safeParse({ ...navigation, links: [{ label: 'Example', url }] }).success, url).toBeTruthy()
		expect(
			homepageSchema.safeParse({
				...homepage,
				featureSections: [{ ...homepage.featureSections[0], links: [{ label: 'Example', url }] }]
			}).success,
			url
		).toBeTruthy()
	}

	for (const url of invalidDestinations) {
		expect(navigationSchema.safeParse({ ...navigation, links: [{ label: 'Example', url }] }).success, url).toBeFalsy()
		const rejected = homepageSchema.safeParse({
			...homepage,
			featureSections: [{ ...homepage.featureSections[0], links: [{ label: 'Example', url }] }]
		})
		expect(rejected.success, url).toBeFalsy()
		if (!rejected.success) {
			expect(rejected.error.issues).toContainEqual(
				expect.objectContaining({
					path: ['featureSections', 0, 'links', 0, 'url'],
					message: 'Use an https URL, mailto:, tel:, site-relative URL, or fragment.'
				})
			)
		}
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

test('homepage feature sections render stored order, images, links, and tone', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 })
	await page.goto('/')

	await expect(page.locator('main > section h2')).toHaveText([
		...homepage.featureSections.map(({ title }) => title),
		homepage.contactHeading
	])
	await expect(page.locator('main')).toContainText(homepage.contactText)

	const backgroundByTone: Record<Homepage['featureSections'][number]['tone'], string[]> = { dark: [], light: [] }

	for (const sectionData of homepage.featureSections) {
		const section = featureSection(page, sectionData.title)
		await expect(section).toHaveCount(1)
		await expect(section.getByRole('img', { name: sectionData.imageAlt, exact: true })).toHaveAttribute(
			'src',
			new RegExp(sectionData.image.replace(/\.[^.]+$/, ''))
		)
		for (const link of sectionData.links) {
			await expect(section.getByRole('link', { name: link.label, exact: true })).toHaveAttribute('href', link.url)
		}

		await expect(section.locator('div.flex > div:has(> img)')).toHaveCSS('order', sectionData.imageFirst ? '1' : '2')
		await expect(section.locator('div.flex > div:has(> h2)')).toHaveCSS('order', sectionData.imageFirst ? '2' : '1')

		backgroundByTone[sectionData.tone].push(
			await section.evaluate((element) => getComputedStyle(element).backgroundColor)
		)
	}

	expect(new Set(backgroundByTone.dark).size).toBe(1)
	expect(new Set(backgroundByTone.light).size).toBe(1)
	expect(backgroundByTone.dark[0]).not.toBe(backgroundByTone.light[0])
})

test('header and footer render stored navigation, contact, and social destinations', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 })
	await page.goto('/')

	const nav = page.getByRole('navigation', { name: 'Main navigation' })
	for (const link of navigation.links) {
		await expect(nav.getByRole('link', { name: link.label, exact: true }).first()).toHaveAttribute('href', link.url)
	}

	const resourceMenu = nav.locator('#resources-menu a')
	await expect(resourceMenu).toHaveCount(navigation.resourceLinks.length)
	for (const [index, link] of navigation.resourceLinks.entries()) {
		await expect(resourceMenu.nth(index)).toHaveText(link.label)
		await expect(resourceMenu.nth(index)).toHaveAttribute('href', `/resources/${link.slug}`)
	}
	await nav.getByRole('button', { name: navigation.resourceLabel, exact: true }).filter({ visible: true }).click()
	await expect(nav.locator('#resources-menu')).toBeVisible()

	await expect(page.getByRole('link', { name: site.contact.email, exact: true })).toHaveAttribute(
		'href',
		`mailto:${site.contact.email}`
	)
	for (const link of site.socialLinks) {
		await expect(page.locator('footer').getByRole('link', { name: link.label, exact: true })).toHaveAttribute(
			'href',
			link.url
		)
	}
})
