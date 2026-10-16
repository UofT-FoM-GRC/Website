import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { teamSchema } from '../src/schemas'

type TeamMember = {
	name: string
	pronouns?: string
	position: string
	image?: string
	imageAlt?: string
	bio?: string
}
type TeamYear = { year: string; members: TeamMember[] }
type TeamData = { about: Record<string, unknown>; currentYear: string; years: TeamYear[] }

const readTeam = () => JSON.parse(readFileSync(new URL('../src/data/team.json', import.meta.url), 'utf8')) as TeamData

const validTeam = (): TeamData => ({
	about: {
		title: 'About the GRC',
		description: 'Description',
		heroImage: '/assets/about.webp',
		heroImageAlt: 'Students meeting',
		purposeTitle: 'Purpose',
		purposeParagraphs: ['Purpose paragraph'],
		objectives: ['Objective'],
		workTitle: 'Work',
		workParagraphs: ['Work paragraph']
	},
	currentYear: '2030 - 2031',
	years: [
		{ year: '2030 - 2031', members: [{ name: 'Zed Leader', position: 'Director' }] },
		{ year: '2029 - 2030', members: [{ name: 'Yara Analyst', position: 'Data Analyst' }] }
	]
})

const accordionContentId = (year: string) => `accordion-content-${year.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`

test('team schema requires a current year selection', () => {
	const team = validTeam()
	delete (team as Partial<TeamData>).currentYear

	const result = teamSchema.safeParse(team)

	expect(result.success).toBeFalsy()
	if (!result.success) {
		expect(result.error.issues).toContainEqual(expect.objectContaining({ path: ['currentYear'] }))
	}
})

test('team schema rejects a current year missing from the listed years', () => {
	const result = teamSchema.safeParse({ ...validTeam(), currentYear: '2028 - 2029' })

	expect(result.success).toBeFalsy()
	if (!result.success) {
		expect(result.error.issues).toContainEqual(
			expect.objectContaining({
				path: ['currentYear'],
				message: 'Current year must match one of the listed academic years.'
			})
		)
	}
})

test('team schema rejects duplicate academic year entries', () => {
	const team = validTeam()
	team.years.push({ year: '2029 - 2030', members: [{ name: 'Duplicated Year', position: 'Member' }] })

	const result = teamSchema.safeParse(team)

	expect(result.success).toBeFalsy()
	if (!result.success) {
		expect(result.error.issues).toContainEqual(
			expect.objectContaining({
				path: ['years', 2, 'year'],
				message: 'Each academic year must appear once.'
			})
		)
	}
})

test('team schema accepts the stored team data and preserves year and member order', () => {
	const stored = readTeam()
	const result = teamSchema.safeParse(stored)
	expect(result.success).toBeTruthy()
	if (!result.success) return

	// The stored year changes every September through the site editor, so check the rule rather than a fixed value.
	expect(result.data.years.map(({ year }) => year)).toContain(result.data.currentYear)

	const ordered = validTeam()
	ordered.years = [
		{ year: '2030 - 2031', members: [{ name: 'Zed Leader', position: 'Director' }] },
		{ year: '2029 - 2030', members: [{ name: 'Yara Analyst', position: 'Data Analyst' }] }
	]
	const orderedResult = teamSchema.safeParse(ordered)
	expect(orderedResult.success).toBeTruthy()
	if (!orderedResult.success) return
	expect(orderedResult.data.years.map(({ year }) => year)).toEqual(['2030 - 2031', '2029 - 2030'])
	expect(orderedResult.data.years.map(({ members }) => members.map(({ name }) => name))).toEqual([
		['Zed Leader'],
		['Yara Analyst']
	])
})

test('team schema accepts a current year listed after the first year', () => {
	const result = teamSchema.safeParse({ ...validTeam(), currentYear: '2029 - 2030' })

	expect(result.success).toBeTruthy()
})

test('about page renders team years in stored order with only the current year expanded', async ({ page }) => {
	const team = readTeam()
	await page.goto('/about/')

	const accordions = page.locator('#about-team button')
	await expect(accordions).toHaveCount(team.years.length)
	expect((await accordions.allTextContents()).map((text) => text.trim())).toEqual(team.years.map(({ year }) => year))

	const current = page.getByRole('button', { name: team.currentYear, exact: true })
	await expect(current).toHaveAttribute('aria-expanded', 'true')
	await expect(page.locator(`#${accordionContentId(team.currentYear)}`)).toBeVisible()

	const archivedYear = team.years.find(({ year }) => year !== team.currentYear)!.year
	const archived = page.getByRole('button', { name: archivedYear, exact: true })
	await expect(archived).toHaveAttribute('aria-expanded', 'false')
	await expect(page.locator(`#${accordionContentId(archivedYear)}`)).toBeHidden()

	await archived.click()
	await expect(archived).toHaveAttribute('aria-expanded', 'true')
	await expect(page.locator(`#${accordionContentId(archivedYear)}`)).toBeVisible()
})

test('about page renders members in stored order with avatar fallback and image descriptions', async ({ page }) => {
	const team = readTeam()
	const currentYear = team.years.find(({ year }) => year === team.currentYear)!
	const panel = page.locator(`#${accordionContentId(currentYear.year)}`)
	await page.goto('/about/')
	await expect(panel).toBeVisible()

	await expect(panel.getByRole('heading', { level: 3 })).toHaveText(currentYear.members.map(({ name }) => name))

	const photoFreeMembers = currentYear.members.filter(({ image }) => !image)
	await expect(panel.locator('img[src="/teams/profile-avatar-placeholder.webp"]')).toHaveCount(photoFreeMembers.length)
	if (photoFreeMembers.length > 0) {
		await expect(panel.locator('img[src="/teams/profile-avatar-placeholder.webp"]').first()).toHaveAttribute('alt', '')
	}

	for (const member of currentYear.members.filter(({ image }) => image)) {
		const image = panel.getByRole('img', { name: member.imageAlt, exact: true })
		await expect(image).toHaveAttribute('src', member.image!)
	}

	for (const member of currentYear.members.filter(({ pronouns }) => pronouns)) {
		await expect(panel.getByText(`Pronouns: ${member.pronouns}`, { exact: true }).first()).toBeAttached()
	}
	for (const member of currentYear.members.filter(({ bio }) => bio)) {
		await expect(panel.getByText(member.bio!, { exact: true })).toBeVisible()
	}
})

test('team schema accepts optional pronouns and bios and drops empty CMS values', () => {
	const team = validTeam()
	team.years[0].members = [
		{ name: 'Zed Leader', pronouns: 'they/them', position: 'Director', bio: 'Studies cell biology.' },
		{ name: 'Empty Fields', pronouns: '', position: 'Member', bio: '' }
	]

	const result = teamSchema.safeParse(team)

	expect(result.success).toBeTruthy()
	if (!result.success) return
	expect(result.data.years[0].members[0]).toMatchObject({ pronouns: 'they/them', bio: 'Studies cell biology.' })
	expect(result.data.years[0].members[1].pronouns).toBeUndefined()
	expect(result.data.years[0].members[1].bio).toBeUndefined()
})

test('bios share one box height on wider screens, scroll when long, and show in full on phones', async ({ page }) => {
	const team = readTeam()
	const currentYear = team.years.find(({ year }) => year === team.currentYear)!
	const bioCount = currentYear.members.filter(({ bio }) => bio).length
	test.skip(bioCount === 0, 'The current team year has no bios.')
	const panel = page.locator(`#${accordionContentId(currentYear.year)}`)
	const bios = panel.locator('[data-profile-bio]')
	const measure = () =>
		bios.evaluateAll((els) =>
			els.map((el) => ({
				height: el.clientHeight,
				scrolls: el.scrollHeight > el.clientHeight + 1,
				focusable: el.tabIndex === 0
			}))
		)

	await page.setViewportSize({ width: 1280, height: 800 })
	await page.goto('/about/')
	await expect(bios).toHaveCount(bioCount)
	// Every box is the same height, and only boxes that scroll join the keyboard tab order.
	await expect
		.poll(async () => {
			const boxes = await measure()
			return new Set(boxes.map(({ height }) => height)).size === 1 && boxes.every((b) => b.focusable === b.scrolls)
		})
		.toBe(true)

	await page.setViewportSize({ width: 390, height: 844 })
	await expect.poll(async () => (await measure()).every(({ scrolls, focusable }) => !scrolls && !focusable)).toBe(true)
})
