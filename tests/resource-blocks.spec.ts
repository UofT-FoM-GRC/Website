import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { resourceSchema } from '../src/schemas'
import {
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

test('unknown block kinds fail with a path-specific validation message', () => {
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

test('unmigrated resource pages keep validating through temporary legacy card fields', () => {
	for (const file of [
		'career-planning-exploration.json',
		'continuing-education.json',
		'health-wellness.json',
		'housing.json',
		'other.json',
		'scholarships-bursaries-awards.json',
		'scholarship-award-grant-application-support.json'
	]) {
		const resource = JSON.parse(readFileSync(new URL(`../src/data/resources/${file}`, import.meta.url), 'utf8'))
		const result = resourceSchema.safeParse(resource)
		expect(result.success, file).toBeTruthy()
		if (result.success) {
			expect(
				result.data.sections.some((section) => section.cards.some(isTypedResourceCard)),
				file
			).toBeFalsy()
		}
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

test('archived sections require a notice and archived cards stay stored without rendering', () => {
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

	const archived = parseResource([
		{
			id: 'archived',
			title: 'Old section',
			status: 'archived',
			archiveNotice: 'This section is kept for reference.',
			replacement: { label: 'See current jobs', url: '/resources/employment/#clnx' },
			cards: [
				{ title: 'Visible card', blocks: [{ type: 'text', body: 'Still shown.' }] },
				{ title: 'Stored card', status: 'archived', blocks: [{ type: 'text', body: 'Should not render.' }] }
			]
		}
	])
	expect(archived.success).toBeTruthy()
	if (!archived.success) return
	const section = archived.data.sections[0]
	expect(isArchivedSection(section)).toBeTruthy()
	expect(visibleResourceCards(section.cards).map((card) => card.title)).toEqual(['Visible card'])
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

test('unmigrated resource pages keep rendering through temporary compatibility', async ({ page }) => {
	await page.goto('/resources/housing/')
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Housing')
	await expect(page.locator('main > section#emergency article').first()).toContainText(
		'Student Emergency Housing Support'
	)
})
