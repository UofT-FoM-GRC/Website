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
type TeamData = {
	about: Record<string, unknown>
	teamPage: Record<string, string>
	currentYear: string
	years: TeamYear[]
}

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
	teamPage: {
		label: 'Graduate Representation Committee',
		title: 'Meet the team',
		description: 'Description',
		image: '/assets/team.webp',
		imageAlt: 'Building'
	},
	currentYear: '2030 - 2031',
	years: [
		{ year: '2030 - 2031', members: [{ name: 'Zed Leader', position: 'Director' }] },
		{ year: '2029 - 2030', members: [{ name: 'Yara Analyst', position: 'Data Analyst' }] }
	]
})

const isAdvisor = ({ position }: TeamMember) => /advisor/i.test(position)
const shortYear = (year: string) => year.replace(/^(\d{4})\s*-\s*\d{2}(\d{2})$/, '$1–$2')

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

test('team page heading comes from the site editor and the current year is labelled', async ({ page }) => {
	const team = readTeam()
	await page.goto('/team/')

	await expect(page.getByRole('heading', { level: 1 })).toHaveText(team.teamPage.title)
	await expect(page.getByText(team.teamPage.description, { exact: true })).toBeVisible()
	await expect(page.locator('#current-team-heading')).toHaveText(shortYear(team.currentYear))
	await expect(page).toHaveTitle(new RegExp(team.teamPage.title))
})

test('current team lists executives as photo cards and advisors as chips, in stored order', async ({ page }) => {
	const team = readTeam()
	const current = team.years.find(({ year }) => year === team.currentYear)!
	const executives = current.members.filter((member) => !isAdvisor(member))
	const advisors = current.members.filter(isAdvisor)
	const section = page.locator('section[aria-labelledby="current-team-heading"]')
	await page.goto('/team/')

	await expect(section.locator('[data-team-card] h4')).toHaveText(executives.map(({ name }) => name))
	await expect(section.locator('[data-team-chip] p:first-of-type')).toHaveText(advisors.map(({ name }) => name))

	for (const member of executives.filter(({ image }) => image)) {
		await expect(section.getByRole('img', { name: member.imageAlt, exact: true })).toHaveAttribute('src', member.image!)
	}
	for (const member of executives.filter(({ pronouns }) => pronouns)) {
		const card = section.locator('[data-team-card]', { has: page.getByRole('heading', { name: member.name }) })
		await expect(card).toContainText(`Pronouns: ${member.pronouns}`)
	}
	// Members without a photo show their initials instead of an empty box.
	for (const member of current.members.filter(({ image }) => !image)) {
		const item = section.locator('li', { hasText: member.name })
		await expect(item.locator('img')).toHaveCount(0)
		await expect(item.locator('[aria-hidden="true"]').first()).toHaveText(/^\s*[A-Z]{1,2}\s*$/)
	}
})

test('a member bio appears over the photo on hover and on keyboard focus', async ({ page }) => {
	const team = readTeam()
	const current = team.years.find(({ year }) => year === team.currentYear)!
	const withBio = current.members.filter((member) => member.bio && !isAdvisor(member))
	test.skip(withBio.length === 0, 'The current team year has no bios.')
	await page.goto('/team/')

	const cards = page.locator('[data-team-card]', { has: page.locator('[data-team-bio]') })
	await expect(cards).toHaveCount(withBio.length)
	const bio = cards.first().locator('[data-team-bio]')
	await expect(bio).toHaveText(withBio[0].bio!)
	await expect(bio).toHaveCSS('opacity', '0')

	await cards.first().hover()
	await expect(bio).toHaveCSS('opacity', '1')

	await page.mouse.move(0, 0)
	await expect(bio).toHaveCSS('opacity', '0')
	await bio.focus()
	await expect(bio).toHaveCSS('opacity', '1')
})

test('on phones a member bio shows under the name without hovering', async ({ page }) => {
	const team = readTeam()
	const current = team.years.find(({ year }) => year === team.currentYear)!
	test.skip(!current.members.some((member) => member.bio && !isAdvisor(member)), 'The current team year has no bios.')
	await page.setViewportSize({ width: 390, height: 844 })
	await page.goto('/team/')

	const card = page.locator('[data-team-card]', { has: page.locator('[data-team-bio]') }).first()
	const bio = card.locator('[data-team-bio]')
	await expect(bio).toHaveCSS('opacity', '1')
	const [nameBox, bioBox] = await Promise.all([card.locator('h4').boundingBox(), bio.boundingBox()])
	expect(bioBox!.y).toBeGreaterThan(nameBox!.y)
})

test('past teams are folded by year in stored order and can be opened together', async ({ page }) => {
	const team = readTeam()
	const pastYears = team.years.filter(({ year }) => year !== team.currentYear)
	test.skip(pastYears.length === 0, 'There are no past team years.')
	await page.goto('/team/')

	const folds = page.locator('details[data-team-year]')
	await expect(folds).toHaveCount(pastYears.length)
	expect(await folds.evaluateAll((els) => els.map((el) => el.getAttribute('data-team-year')))).toEqual(
		pastYears.map(({ year }) => year)
	)
	expect(await folds.evaluateAll((els) => els.some((el) => (el as HTMLDetailsElement).open))).toBe(false)

	const first = folds.first()
	await first.locator('summary').click()
	await expect(first).toHaveAttribute('open', '')
	const firstYear = pastYears[0]
	const expectedOrder = [...firstYear.members.filter((m) => !isAdvisor(m)), ...firstYear.members.filter(isAdvisor)]
	await expect(first.locator('[data-team-chip] p:first-of-type')).toHaveText(expectedOrder.map(({ name }) => name))

	// Several years can be open at once for comparing teams.
	if (pastYears.length > 1) {
		const second = folds.nth(1)
		await second.locator('summary').click()
		await expect(second).toHaveAttribute('open', '')
		await expect(first).toHaveAttribute('open', '')
	}
})

test('about page links to the team page instead of listing members', async ({ page }) => {
	await page.goto('/about/')
	await expect(page.locator('[data-team-card], [data-team-chip]')).toHaveCount(0)
	await page.getByRole('link', { name: /Meet the team/ }).click()
	await expect(page).toHaveURL(/\/team\/?$/)
})
