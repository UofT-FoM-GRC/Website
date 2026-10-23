import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { pagesSchema } from '../src/schemas'
import { academicYear } from '../src/utils/blog'

const readJson = <T>(path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as T
type Band = { label: string; title: string; description: string }
const pages = readJson<{
	resources: {
		band: Band
		searchPrompt: string
		urgentContacts: { label: string; number: string; url: string; note?: string }[]
		updates: unknown[]
	}
	blog: { band: Band }
	contact: { band: Band }
}>('../src/data/pages.json')
const navigation = readJson<{ links: { label: string; url: string }[]; resourceLinks: { slug: string }[] }>(
	'../src/data/navigation.json'
)
const site = readJson<{ contact: { email: string }; socialLinks: { url: string; network: string }[] }>(
	'../src/data/site.json'
)

test('page settings accept the stored content and reject unsafe links', () => {
	expect(pagesSchema.safeParse(pages).success).toBeTruthy()

	const withUpdates = structuredClone(pages)
	withUpdates.resources.updates = [
		{ kind: 'coming-soon', title: 'Stipend calculator' },
		{ kind: 'new', tag: 'Housing', title: 'Housing finder', url: '/resources/housing', description: '' }
	]
	const parsed = pagesSchema.safeParse(withUpdates)
	expect(parsed.success).toBeTruthy()
	if (parsed.success) expect(parsed.data.resources.updates[1].description).toBeUndefined()

	const unsafe = structuredClone(pages)
	unsafe.resources.urgentContacts[0].url = 'javascript:alert(1)'
	expect(pagesSchema.safeParse(unsafe).success).toBeFalsy()
})

test('academic years run from September to August', () => {
	expect(academicYear(new Date('2024-09-01T00:00:00.000Z'))).toBe('2024–25')
	expect(academicYear(new Date('2025-08-31T00:00:00.000Z'))).toBe('2024–25')
	expect(academicYear(new Date('2025-12-01T00:00:00.000Z'))).toBe('2025–26')
})

test('resources page shows urgent numbers, then every topic in menu order', async ({ page }) => {
	await page.goto('/resources/')
	await expect(page.getByRole('heading', { level: 1 })).toHaveText(pages.resources.band.title)

	const urgent = page.locator('section[aria-labelledby="urgent-help-heading"] li')
	await expect(urgent).toHaveCount(pages.resources.urgentContacts.length)
	for (const [index, contact] of pages.resources.urgentContacts.entries()) {
		await expect(urgent.nth(index).getByRole('link', { name: contact.number })).toHaveAttribute('href', contact.url)
	}

	const topics = page.locator('section[aria-labelledby="topics-heading"] a')
	expect(await topics.evaluateAll((links) => links.map((link) => link.getAttribute('href')))).toEqual(
		navigation.resourceLinks.map(({ slug }) => `/resources/${slug}/`)
	)
	await expect(page.locator('#topics-heading + span')).toHaveText(`${navigation.resourceLinks.length} topics`)

	// The new-and-coming-soon row shows every stored item in order, and stays hidden when the list is empty.
	const updates = pages.resources.updates as { kind: string; title: string; url?: string }[]
	await expect(page.locator('#updates-heading')).toHaveCount(updates.length > 0 ? 1 : 0)
	const cards = page.locator('section[aria-labelledby="updates-heading"] li')
	await expect(cards).toHaveCount(updates.length)
	for (const [index, item] of updates.entries()) {
		await expect(cards.nth(index)).toContainText(item.title)
		await expect(cards.nth(index)).toContainText(item.kind === 'coming-soon' ? 'Coming soon' : 'New')
		if (item.url) await expect(cards.nth(index).getByRole('link')).toHaveAttribute('href', item.url)
	}

	await page.getByRole('button', { name: pages.resources.searchPrompt }).click()
	await expect(page.getByRole('dialog', { name: 'Search this site' })).toBeVisible()
})

test('blog page groups current posts by topic with jump links and folds ended posts by year', async ({ page }) => {
	await page.goto('/blog/')
	await expect(page.getByRole('heading', { level: 1 })).toHaveText(pages.blog.band.title)

	const jump = page.getByRole('navigation', { name: 'Blog topics' }).getByRole('link')
	const sections = page.locator('section[aria-labelledby^="topic-"]')
	const sectionIds = await sections.evaluateAll((els) => els.map((el) => el.getAttribute('aria-labelledby')))
	expect(sectionIds.length).toBeGreaterThan(0)
	const jumpTargets = await jump.evaluateAll((links) => links.map((link) => link.getAttribute('href')))
	expect(jumpTargets).toEqual([...sectionIds.map((id) => `#${id}`), '#archive-heading'])

	// Each post appears once, newest first within its topic.
	const postLinks = await sections.locator('a').evaluateAll((links) => links.map((link) => link.getAttribute('href')))
	expect(new Set(postLinks).size).toBe(postLinks.length)
	for (const section of await sections.all()) {
		const dates = await section
			.locator('time')
			.evaluateAll((times) => times.map((time) => Date.parse(time.getAttribute('datetime')!)))
		expect(dates).toEqual([...dates].sort((a, b) => b - a))
	}

	const archive = page.locator('details[data-archive-year]')
	await expect(archive.first()).not.toHaveAttribute('open', '')
	await archive.first().locator('summary').click()
	await expect(archive.first().getByRole('link').first()).toBeVisible()
})

test('contact menu item opens the contact page with email and social links', async ({ page }) => {
	await page.goto('/about/')
	const contact = navigation.links.find(({ label }) => label === 'Contact')!
	expect(contact.url).toBe('/contact')
	await page
		.getByRole('navigation', { name: 'Main navigation' })
		.getByRole('link', { name: 'Contact', exact: true })
		.filter({ visible: true })
		.click()
	await expect(page).toHaveURL(/\/contact\/?$/)
	await expect(page.getByRole('heading', { level: 1 })).toHaveText(pages.contact.band.title)

	const channels = page.locator('ul[data-contact-channels] a')
	await expect(channels).toHaveCount(1 + site.socialLinks.length)
	await expect(channels.first()).toHaveAttribute('href', `mailto:${site.contact.email}`)
	for (const link of site.socialLinks) {
		await expect(page.locator(`ul[data-contact-channels] a[href="${link.url}"]`)).toHaveAttribute('target', '_blank')
	}
	await expect(page.locator('form')).toHaveCount(0)
})

test('the sitemap lists the Team and Contact pages', async ({ request }) => {
	const sitemap = await (await request.get('/sitemap-0.xml')).text()
	expect(sitemap).toContain('https://uoftfomgrc.ca/team/')
	expect(sitemap).toContain('https://uoftfomgrc.ca/contact/')
})

test('international students topic has its own page, linked from Browse by topic', async ({ page }) => {
	const resource = readJson<{ title: string; sections: { id: string; title: string; cards: unknown[] }[] }>(
		'../src/data/resources/international-students.json'
	)
	await page.goto('/resources/')
	await page.locator('section[aria-labelledby="topics-heading"] a[href="/resources/international-students/"]').click()
	await expect(page).toHaveURL(/\/resources\/international-students\/$/)
	await expect(page.getByRole('heading', { level: 1 })).toHaveText(resource.title)
	for (const section of resource.sections) {
		const sectionLocator = page.locator(`main > section#${section.id}`)
		await expect(sectionLocator.getByRole('heading', { level: 2 })).toHaveText(section.title)
		await expect(sectionLocator.locator('article')).toHaveCount(section.cards.length)
	}
})
