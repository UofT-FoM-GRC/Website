import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { resourceSchema } from '../src/schemas'
import {
	currentResourceSections,
	generateSectionAnchor,
	isArchivedSection,
	isTypedResourceCard,
	renderResourceCallout,
	renderResourceMarkdown,
	visibleResourceCards
} from '../src/utils/resourceContent'

const resourceBase = {
	slug: 'other' as const,
	title: 'Typed block resource',
	description: 'A test resource.',
	cardTitle: 'Typed blocks',
	cardImage: '/assets/card.webp',
	cardImageAlt: 'A card image.'
}

const parseResource = (sections: unknown) => resourceSchema.safeParse({ ...resourceBase, sections })

test('every typed resource-card block validates through the public schema', () => {
	const result = parseResource([
		{
			id: 'blocks',
			title: 'Supported blocks',
			columns: 1,
			cards: [
				{
					title: 'Pilot card',
					blocks: [
						{ type: 'text', body: 'Visit the **guide** for details.' },
						{ type: 'image', image: '/assets/students.webp', imageAlt: 'Students discussing a project' },
						{
							type: 'links',
							appearance: 'button',
							items: [{ label: 'Open the guide', url: 'https://example.com/guide' }]
						},
						{
							type: 'steps',
							listStyle: 'ordered',
							items: [
								{
									text: 'Call',
									links: [{ label: '416-978-8030', url: 'tel:416-978-8030' }],
									items: ['Press 5 for mental health care']
								}
							]
						},
						{
							type: 'contact',
							addressLines: ['21 Sussex Avenue'],
							facts: [{ label: 'Phone:', value: '416-978-2222', url: 'tel:416-978-2222' }]
						},
						{
							type: 'contact-panels',
							panels: [
								{
									title: 'Community Safety Office',
									text: ['During office hours.'],
									addressLines: ['21 Sussex Avenue'],
									facts: [{ label: 'General Line:', value: '416-978-1485' }],
									links: [{ label: 'Website', url: 'https://www.communitysafety.utoronto.ca/' }]
								}
							]
						},
						{
							type: 'callout',
							kind: 'warning',
							title: 'Before you apply',
							body: 'Read the **instructions**.'
						}
					]
				}
			]
		}
	])

	expect(result.success).toBeTruthy()
	if (!result.success) return
	const card = result.data.sections[0].cards[0]
	expect(isTypedResourceCard(card)).toBeTruthy()
	if (isTypedResourceCard(card)) {
		expect(card.blocks.map((block) => block.type)).toEqual([
			'text',
			'image',
			'links',
			'steps',
			'contact',
			'contact-panels',
			'callout'
		])
	}
})

test('unknown block types fail with a path-specific validation message', () => {
	const result = parseResource([
		{
			id: 'blocks',
			title: 'Unsupported block',
			cards: [{ title: 'Broken card', blocks: [{ type: 'hero', body: 'Not a supported block.' }] }]
		}
	])

	expect(result.success).toBeFalsy()
	if (!result.success) {
		expect(result.error.issues).toContainEqual({
			code: 'custom',
			path: ['sections', 0, 'cards', 0, 'blocks', 0, 'type'],
			message: 'Unknown block type "hero".'
		})
	}
})

const textAndLinkResourceFiles = [
	'career-planning-exploration.json',
	'continuing-education.json',
	'other.json',
	'scholarship-award-grant-application-support.json'
] as const

const contactRichResourceFiles = ['health-wellness.json', 'housing.json', 'scholarships-bursaries-awards.json'] as const

const readResource = (file: string) =>
	JSON.parse(readFileSync(new URL(`../src/data/resources/${file}`, import.meta.url), 'utf8')) as unknown

const readInventory = (file: string) =>
	JSON.parse(readFileSync(new URL(`./fixtures/content-contract/resources/${file}`, import.meta.url), 'utf8')) as {
		sections: Array<{
			id: string
			title: string
			intro: string[]
			columns: number
			cards: Array<{
				title: string
				text: string[]
				links: Array<{ label: string; url: string }>
				bullets: string[]
				listStyle?: string
				listItems?: Array<{ text: string; links?: Array<{ label: string; url: string }>; items?: string[] }>
				groups?: Array<{
					title: string
					text?: string[]
					links?: Array<{ label: string; url: string }>
					addressLines?: string[]
					facts?: Array<{ label: string; value: string; url?: string }>
				}>
				addressLines?: string[]
				facts?: Array<{ label: string; value: string; url?: string }>
				image?: string
				imageAlt?: string
				variant?: string
				linkStyle?: string
			}>
		}>
	}

const expectStoredPageAccountsForInventory = (file: string) => {
	const stored = readResource(file) as {
		sections: Array<{
			id: string
			title: string
			intro: string[]
			columns: number
			cards: Array<{ title: string; variant?: string; blocks: Array<{ type: string; appearance?: string }> }>
		}>
	}
	const inventory = readInventory(file)
	expect(stored.sections).toHaveLength(inventory.sections.length)
	for (const [sectionIndex, section] of inventory.sections.entries()) {
		const storedSection = stored.sections[sectionIndex]
		expect(storedSection.id).toBe(section.id)
		expect(storedSection.title).toBe(section.title)
		expect(storedSection.intro).toEqual(section.intro)
		expect(storedSection.columns).toBe(section.columns)
		expect(storedSection.cards).toHaveLength(section.cards.length)
		for (const [cardIndex, card] of section.cards.entries()) {
			const storedCard = storedSection.cards[cardIndex]
			expect(storedCard.title).toBe(card.title)
			expect(storedCard.variant ?? 'card').toBe(card.variant ?? 'card')
			expect(storedCard.blocks, `${file} ${card.title}`).toBeDefined()
			const encoded = JSON.stringify(storedCard.blocks)
			for (const paragraph of card.text) expect(encoded, `${file} ${card.title}`).toContain(paragraph)
			for (const bullet of card.bullets) expect(encoded, `${file} ${card.title}`).toContain(bullet)
			for (const link of card.links) {
				expect(encoded).toContain(link.label)
				expect(encoded).toContain(link.url)
			}
			if (card.image) expect(encoded).toContain(card.image)
			if (card.imageAlt) expect(encoded).toContain(card.imageAlt)
			if (card.linkStyle === 'button') {
				expect(storedCard.blocks.some((block) => block.type === 'links' && block.appearance === 'button')).toBeTruthy()
			} else if (card.links.length > 0) {
				expect(
					storedCard.blocks.some((block) => block.type === 'links' && (block.appearance ?? 'link') === 'link')
				).toBeTruthy()
			}
			for (const line of card.addressLines ?? []) expect(encoded).toContain(line)
			for (const fact of card.facts ?? []) {
				expect(encoded).toContain(fact.label)
				expect(encoded).toContain(fact.value)
				if (fact.url) expect(encoded).toContain(fact.url)
			}
			for (const item of card.listItems ?? []) {
				expect(encoded).toContain(item.text)
				for (const nested of item.items ?? []) expect(encoded).toContain(nested)
				for (const link of item.links ?? []) {
					expect(encoded).toContain(link.label)
					expect(encoded).toContain(link.url)
				}
			}
			if (card.listStyle === 'ordered') expect(encoded).toContain('"listStyle":"ordered"')
			for (const group of card.groups ?? []) {
				expect(encoded).toContain(group.title)
				for (const paragraph of group.text ?? []) expect(encoded).toContain(paragraph)
				for (const line of group.addressLines ?? []) expect(encoded).toContain(line)
				for (const fact of group.facts ?? []) {
					expect(encoded).toContain(fact.label)
					expect(encoded).toContain(fact.value)
				}
				for (const link of group.links ?? []) {
					expect(encoded).toContain(link.label)
					expect(encoded).toContain(link.url)
				}
			}
		}
	}
}

test('temporary legacy card fields still validate until compatibility is removed', () => {
	const result = parseResource([
		{
			id: 'legacy',
			title: 'Legacy section',
			cards: [{ title: 'Legacy card', text: ['Still allowed through temporary compatibility.'] }]
		}
	])
	expect(result.success).toBeTruthy()
	if (result.success) {
		expect(isTypedResourceCard(result.data.sections[0].cards[0])).toBeFalsy()
	}
})

test('text-and-link resource pages store card details exclusively as typed blocks', () => {
	for (const file of textAndLinkResourceFiles) {
		const parsed = resourceSchema.safeParse(readResource(file))
		expect(parsed.success, file).toBeTruthy()
		if (!parsed.success) continue
		expect(
			parsed.data.sections.every((section) => section.cards.every(isTypedResourceCard)),
			file
		).toBeTruthy()
		expectStoredPageAccountsForInventory(file)
	}
})

test('contact-rich resource pages store card details exclusively as typed blocks', () => {
	for (const file of contactRichResourceFiles) {
		const parsed = resourceSchema.safeParse(readResource(file))
		expect(parsed.success, file).toBeTruthy()
		if (!parsed.success) continue
		expect(
			parsed.data.sections.every((section) => section.cards.every(isTypedResourceCard)),
			file
		).toBeTruthy()
		expectStoredPageAccountsForInventory(file)
	}
})

test('employment stores card details as typed blocks', () => {
	const employment = JSON.parse(
		readFileSync(new URL('../src/data/resources/employment.json', import.meta.url), 'utf8')
	) as unknown
	const parsedEmployment = resourceSchema.safeParse(employment)
	expect(parsedEmployment.success).toBeTruthy()
	if (!parsedEmployment.success) return
	expect(parsedEmployment.data.sections.every((section) => section.cards.every(isTypedResourceCard))).toBeTruthy()
	expect(parsedEmployment.data.sections[0].cards[0]).toMatchObject({
		title: 'CUPE 3902 Job Postings',
		blocks: [
			{
				type: 'text',
				body: 'These positions are open to Graduate Students in the School of Graduate Studies, Postdoctoral Fellows and Undergraduate Students in the University of Toronto.'
			},
			{
				type: 'links',
				appearance: 'button',
				items: [{ label: 'View CUPE Positions →', url: 'https://unit1.hrandequity.utoronto.ca/' }]
			}
		]
	})
})

test('archived sections require a notice and leave quick navigation, intro, cards, and Pagefind', () => {
	const missingNotice = parseResource([
		{ id: 'archived', title: 'Old section', status: 'archived', cards: [{ title: 'Hidden card', blocks: [] }] }
	])
	expect(missingNotice.success).toBeFalsy()
	if (!missingNotice.success) {
		expect(missingNotice.error.issues).toContainEqual({
			code: 'custom',
			path: ['sections', 0, 'archiveNotice'],
			message: 'Archived sections require a short notice.'
		})
	}

	const parsed = parseResource([
		{
			id: 'jobs',
			title: 'Current jobs',
			cards: [{ title: 'Open role', blocks: [{ type: 'text', body: 'Still shown.' }] }]
		},
		{
			id: 'archived',
			title: 'Old section',
			intro: ['This intro must not render.'],
			status: 'archived',
			archiveNotice: 'This section is kept for reference.',
			replacement: { label: 'See current jobs', url: '/resources/employment/#clnx' },
			cards: [
				{ title: 'Current card in archived section', blocks: [{ type: 'text', body: 'Must not render.' }] },
				{ title: 'Stored card', status: 'archived', blocks: [{ type: 'text', body: 'Should not render.' }] }
			]
		}
	])
	expect(parsed.success).toBeTruthy()
	if (!parsed.success) return
	expect(currentResourceSections(parsed.data.sections).map((section) => section.id)).toEqual(['jobs'])
	const archived = parsed.data.sections[1]
	expect(isArchivedSection(archived)).toBeTruthy()
	expect(archived.intro).toEqual(['This intro must not render.'])
	expect(archived.cards.map((card) => card.title)).toEqual(['Current card in archived section', 'Stored card'])
	expect(visibleResourceCards(archived.cards).map((card) => card.title)).toEqual(['Current card in archived section'])
})

test('new section anchors generate once from the heading, stay unique, and do not change later', () => {
	expect(generateSectionAnchor('Additional Resources', [])).toBe('additional-resources')
	expect(generateSectionAnchor('Resources', ['resources'])).toBe('resources-2')
	expect(generateSectionAnchor('Resources', ['resources', 'resources-2'])).toBe('resources-3')
	expect(generateSectionAnchor('  Career & Co-curricular Learning Network  ', ['clnx'])).toBe(
		'career-and-co-curricular-learning-network'
	)

	const first = generateSectionAnchor('CUPE Local 3902 Unit 1 Job Postings', [])
	expect(generateSectionAnchor('Changed heading', [first])).not.toBe(first)
	expect(first).toBe('cupe-local-3902-unit-1-job-postings')
})

test('resource callouts reuse the shared blog callout renderer', () => {
	const output = renderResourceCallout({
		type: 'callout',
		kind: 'warning',
		title: 'Before you apply',
		body: 'Read the **instructions**.\n\n1. Confirm eligibility\n2. Submit the form'
	})

	expect(output).toContain('<aside class="semantic-callout" data-callout-kind="warning">')
	expect(output).toContain('Warning')
	expect(output).toContain('Before you apply')
	expect(output).toContain('<strong>instructions</strong>')
	expect(output).toContain('<ol>')
	expect(output).toMatch(/semantic-callout__icon[^>]*aria-hidden="true"/)
})

test('formatted resource markdown allows only paragraphs, emphasis, links, and bullet lists', () => {
	expect(renderResourceMarkdown('Visit the **guide** for [details](https://example.com).')).toBe(
		'<p>Visit the <strong>guide</strong> for <a href="https://example.com">details</a>.</p>'
	)
	expect(renderResourceMarkdown('- First\n- Second')).toBe('<ul>\n<li>First</li>\n<li>Second</li>\n</ul>')
	expect(() => renderResourceMarkdown('# Heading')).toThrow('Formatted text cannot include headings.')
	expect(() => renderResourceMarkdown('<em>raw</em>')).toThrow('Raw HTML is not allowed in formatted text.')
	expect(() => renderResourceMarkdown(':::callout{kind="information"}\nNested\n:::')).toThrow(
		'Semantic directives are not allowed in formatted text.'
	)
	expect(() => renderResourceMarkdown('[Open](javascript:alert(1))')).toThrow(
		'Formatted text links must use https, http, mailto, tel, a site-relative path, or a fragment.'
	)
})

test('duplicate section anchors fail validation', () => {
	const result = parseResource([
		{ id: 'jobs', title: 'Jobs', cards: [] },
		{ id: 'jobs', title: 'More jobs', cards: [] }
	])
	expect(result.success).toBeFalsy()
	if (!result.success) {
		expect(result.error.issues).toContainEqual({
			code: 'custom',
			path: ['sections'],
			message: 'Each section ID must be unique within a resource page.'
		})
	}
})

test('employment public page keeps its route, anchors, card order, links, and button appearance', async ({ page }) => {
	await page.goto('/resources/employment/')
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Employment Resources')
	await expect(page.locator('nav[aria-label="Quick navigation"] a[href="#cupe"]')).toContainText(
		'CUPE Local 3902 Unit 1 Job Postings'
	)
	const cupe = page.locator('main > section#cupe article')
	await expect(cupe).toHaveCount(1)
	await expect(cupe.getByRole('link', { name: 'View CUPE Positions →' })).toHaveAttribute(
		'href',
		'https://unit1.hrandequity.utoronto.ca/'
	)
	await expect(cupe.getByRole('link', { name: 'View CUPE Positions →' })).toHaveClass(/bg-blue-600/)
	await expect(page.locator('main > section#clnx article')).toHaveCount(5)
	await expect(page.locator('main > section#resources article')).toHaveCount(2)
})

test('contact-rich public pages keep routes, anchors, steps, contacts, panels, and buttons', async ({ page }) => {
	await page.goto('/resources/health-wellness/')
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Health & Wellness')
	await expect(page.locator('nav[aria-label="Quick navigation"] a[href="#appointments"]')).toContainText(
		'Health & Wellness Appointments'
	)
	const instructions = page.locator('main > section#appointments article').first()
	await expect(instructions.locator(':scope > ol > li')).toHaveCount(4)
	await expect(instructions.getByRole('link', { name: '416-978-8030' })).toHaveAttribute('href', 'tel:416-978-8030')
	await expect(instructions.locator(':scope > ol > li').nth(1).locator(':scope > ul > li')).toContainText([
		'Press 5 for mental health care',
		'Press 2 for primary care'
	])
	const telus = page.locator('main > section#telus article').first()
	await expect(telus.getByRole('link', { name: '1-844-451-9700' })).toHaveAttribute('href', 'tel:1-844-451-9700')

	await page.goto('/resources/housing/')
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Housing')
	const emergency = page.locator('main > section#emergency article').first()
	await expect(emergency).toContainText('Student Emergency Housing Support')
	await expect(emergency.getByRole('link', { name: '416-978-2222' })).toHaveAttribute('href', 'tel:416-978-2222')
	const panels = page.locator('main > section#emergency article').nth(1)
	await expect(
		panels.getByRole('heading', { level: 4, name: 'Community Safety Office (During Office Hours)' })
	).toHaveCount(1)
	await expect(
		page.locator('main > section#graduate article').nth(1).getByRole('link', { name: 'Enable UTORid →' })
	).toHaveClass(/bg-blue-600/)

	await page.goto('/resources/scholarships-bursaries-awards/')
	await expect(page.locator('main > section#contacts article')).toHaveCount(2)
	const advising = page.locator('main > section#contacts article').first()
	await expect(advising.locator('address')).toContainText('63 St. George Street, Room 101')
	await expect(advising.getByRole('link', { name: 'sgs.financial.assistance@utoronto.ca' })).toHaveAttribute(
		'href',
		'mailto:sgs.financial.assistance@utoronto.ca'
	)
	await expect(page.getByRole('link', { name: 'Explore Undergraduate Awards →' })).toHaveClass(/bg-blue-600/)
})

test('text-and-link public pages keep routes, anchors, card order, images, buttons, and plain cards', async ({
	page
}) => {
	await page.goto('/resources/career-planning-exploration/')
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Career Planning & Exploration Resources')
	await expect(page.locator('nav[aria-label="Quick navigation"] a[href="#events"]')).toContainText(
		'Upcoming Career Events'
	)
	const calendar = page.locator('main > section#events article').first()
	await expect(calendar).not.toHaveClass(/rounded-lg/)
	await expect(calendar.getByRole('link', { name: 'Career Services Calendar →' })).not.toHaveClass(/bg-blue-600/)
	const navigator = page.locator('main > section#tools article').first()
	await expect(navigator.getByRole('link', { name: 'Access Navigator' })).toHaveClass(/bg-blue-600/)
	await expect(page.locator('main > section#resources article')).toHaveCount(2)
	await expect(page.locator('main > section#tools article')).toHaveCount(3)

	await page.goto('/resources/continuing-education/')
	await expect(page.locator('main > section#scs article')).toHaveCount(3)
	await expect(page.getByRole('link', { name: 'Browse Programs →' })).toHaveClass(/bg-blue-600/)

	await page.goto('/resources/other/')
	const hartHouse = page.locator('main > section#fitness article').first()
	const hartHouseImage = hartHouse.getByRole('img', { name: 'Hart House Fitness Centre' })
	await expect(hartHouseImage).toHaveAttribute('src', /HartHouse/i)
	await expect(hartHouse.getByRole('link', { name: 'Explore Hart House →' })).toHaveClass(/bg-blue-600/)
	const imageBox = await hartHouseImage.boundingBox()
	const headingBox = await hartHouse.getByRole('heading', { level: 3 }).boundingBox()
	expect(imageBox?.y).toBeLessThan(headingBox?.y ?? 0)
	await expect(page.locator('main > section#fitness article')).toHaveCount(3)

	await page.goto('/resources/scholarship-award-grant-application-support/')
	await expect(page.locator('nav[aria-label="Quick navigation"] a[href="#writing-centres"]')).toContainText(
		'Writing Centres'
	)
	await expect(page.locator('main > section#writing-centres article')).toHaveCount(7)
	await expect(page.locator('main > section#learning-support article')).toHaveCount(6)
})
