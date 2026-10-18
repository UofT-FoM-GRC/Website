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

const validAbout = () => ({
	title: 'About the GRC',
	headline: 'Headline',
	description: 'Description',
	heroLinks: [{ label: 'See our work', url: '#our-work' }],
	surveyFigure: { show: true, value: 50, statement: 'respondents said something.', source: 'Survey, 10 respondents.' },
	purposeTitle: 'Purpose',
	purposeParagraphs: ['Purpose paragraph'],
	objectivesIntro: 'We aim to ensure that you:',
	objectives: [{ keyword: 'inform.', text: 'Objective' }],
	workTitle: 'Work',
	workParagraphs: ['Work paragraph'],
	workSteps: ['Survey', 'Compare', 'Report', 'Recommend'].map((title) => ({ title, text: `${title} text` })),
	workCycleLabel: 'Each year',
	workCycleNote: 'then it starts again',
	resourcesBand: { text: 'Band text', links: [{ label: 'Browse resources', url: '/resources' }] },
	contactPrompt: 'Questions?'
})

const validTeam = (): TeamData => ({
	about: validAbout(),
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
const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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
	// Once fully shown, the bio must stay on top of the photo wherever the pointer rests.
	const photo = (await cards.first().locator('img').boundingBox())!
	for (const [fx, fy] of [
		[0.5, 0.5],
		[0.1, 0.1],
		[0.9, 0.9]
	]) {
		const onTop = await page.evaluate(
			([x, y]) => Boolean(document.elementFromPoint(x, y)?.closest('[data-team-bio]')),
			[photo.x + photo.width * fx, photo.y + photo.height * fy]
		)
		expect(onTop).toBe(true)
	}
	await expect(bio).not.toHaveCSS('font-style', 'italic')

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

test('about schema keeps four loop steps, up to three objectives, a 0–100 figure and safe links', () => {
	const withAbout = (about: Record<string, unknown>) => teamSchema.safeParse({ ...validTeam(), about })
	const about = validAbout()

	expect(withAbout(about).success).toBeTruthy()
	expect(withAbout({ ...about, workSteps: about.workSteps.slice(0, 3) }).success).toBeFalsy()
	expect(withAbout({ ...about, objectives: Array(4).fill(about.objectives[0]) }).success).toBeFalsy()
	expect(withAbout({ ...about, surveyFigure: { ...about.surveyFigure, value: 101 } }).success).toBeFalsy()
	expect(withAbout({ ...about, heroLinks: [{ label: 'Bad', url: 'javascript:alert(1)' }] }).success).toBeFalsy()
	expect(
		withAbout({ ...about, resourcesBand: { ...about.resourcesBand, links: Array(3).fill(about.heroLinks[0]) } }).success
	).toBeFalsy()

	// The figure stays hidden unless it is switched on.
	const figureWithoutSwitch: Partial<About['surveyFigure']> = structuredClone(about.surveyFigure)
	delete figureWithoutSwitch.show
	const parsed = withAbout({ ...about, surveyFigure: figureWithoutSwitch })
	expect(parsed.success).toBeTruthy()
	if (parsed.success) expect(parsed.data.about.surveyFigure.show).toBe(false)
})

type About = ReturnType<typeof validAbout>

test('about page shows the stored headline, survey figure, objectives, yearly loop and links in order', async ({
	page
}) => {
	const about = readTeam().about as unknown as About
	await page.goto('/about/')

	await expect(page.getByRole('heading', { level: 1 })).toHaveText(about.headline)
	await expect(page).toHaveTitle(new RegExp(about.title))
	const hero = page.locator('#about-hero')
	for (const link of about.heroLinks) {
		await expect(hero.getByRole('link', { name: link.label, exact: true })).toHaveAttribute('href', link.url)
	}

	const figure = page.locator('[data-survey-figure]')
	if (about.surveyFigure.show) {
		await expect(figure.locator('[data-dot]')).toHaveCount(100)
		await expect(figure.locator('[data-dot="filled"]')).toHaveCount(about.surveyFigure.value)
		await expect(figure.locator('.sr-only')).toHaveText(`${about.surveyFigure.value} out of 100`)
		await expect(figure).toContainText(about.surveyFigure.statement)
		await expect(figure).toContainText(about.surveyFigure.source)
	} else {
		await expect(figure).toHaveCount(0)
	}

	await expect(page.locator('#purpose-heading')).toHaveText(about.purposeTitle)
	await expect(page.locator('[data-objectives] li')).toHaveText(
		about.objectives.map(({ keyword, text }) => new RegExp(`${escapeRegExp(keyword)}\\s*${escapeRegExp(text)}`))
	)
	await expect(page.locator('[data-work-steps] h3')).toHaveText(about.workSteps.map(({ title }) => title))
	await expect(page.locator('#our-work')).toContainText(about.workCycleLabel)

	for (const link of about.resourcesBand.links) {
		await expect(page.getByRole('link', { name: link.label, exact: true })).toHaveAttribute('href', link.url)
	}
	await expect(page.locator('#about-team')).toContainText(about.contactPrompt)
})

test('about page keeps its old section links and its "See our work" button scrolls to the loop', async ({ page }) => {
	await page.goto('/about/')
	for (const id of ['about-hero', 'about-content', 'our-work', 'about-team']) {
		await expect(page.locator(`#${id}`)).toHaveCount(1)
	}
	const toWork = page.locator('#about-hero a[href="#our-work"]')
	test.skip((await toWork.count()) === 0, 'No headline button points to the Our Work section.')
	await toWork.click()
	await expect(page).toHaveURL(/#our-work$/)
	await expect(page.locator('#work-heading')).toBeInViewport()
})

test('the yearly loop sits around the circle on wide screens and stacks in order on phones', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 })
	await page.goto('/about/')
	const steps = page.locator('[data-work-steps] > li')
	const ring = page.locator('.work-ring')
	await expect(ring).toBeVisible()
	const [top, right, bottom, left] = await Promise.all([0, 1, 2, 3].map((index) => steps.nth(index).boundingBox()))
	const circle = (await ring.boundingBox())!
	expect(top!.y + top!.height).toBeLessThanOrEqual(circle.y + 1)
	expect(right!.x).toBeGreaterThanOrEqual(circle.x + circle.width - 1)
	expect(bottom!.y).toBeGreaterThanOrEqual(circle.y + circle.height - 1)
	expect(left!.x + left!.width).toBeLessThanOrEqual(circle.x + 1)

	await page.setViewportSize({ width: 390, height: 844 })
	await expect(ring).toBeHidden()
	const stacked = await steps.evaluateAll((items) => items.map((item) => item.getBoundingClientRect().top))
	expect(stacked).toEqual([...stacked].sort((a, b) => a - b))
	// Nothing on the page is wider than a phone screen.
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})

test('about page links to the team page instead of listing members', async ({ page }) => {
	await page.goto('/about/')
	await expect(page.locator('[data-team-card], [data-team-chip]')).toHaveCount(0)
	const team = readTeam()
	const teamLinks = page.locator('main a[href="/team"]')
	await expect(teamLinks.first()).toBeVisible()
	await page.locator('#about-team').getByRole('link', { name: team.teamPage.title }).click()
	await expect(page).toHaveURL(/\/team\/?$/)
})

test('about page contact lines use the site email and Instagram link', async ({ page }) => {
	const site = JSON.parse(readFileSync(new URL('../src/data/site.json', import.meta.url), 'utf8')) as {
		contact: { email: string }
		socialLinks: { url: string; network: string }[]
	}
	await page.goto('/about/')
	const contact = page.locator('[data-about-contact]')
	await expect(contact.getByRole('link', { name: site.contact.email })).toHaveAttribute(
		'href',
		`mailto:${site.contact.email}`
	)
	const instagram = site.socialLinks.find(({ network }) => network === 'instagram')
	if (instagram) await expect(contact.locator(`a[href="${instagram.url}"]`)).toHaveAttribute('target', '_blank')
})
