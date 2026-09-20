import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { teamSchema } from '../src/schemas'

type TeamMember = { name: string; position: string; image?: string; imageAlt?: string }
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

	expect(result.data.currentYear).toBe('2025 - 2026')

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
})
