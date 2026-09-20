import { expect, test, type Locator, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { contentContract } from './fixtures/content-contract'

type Link = { label: string; url: string }
type Fact = { label: string; value: string; url?: string }
type ListItem = { text: string; links?: Link[]; items?: string[] }
type Group = { title: string; text?: string[]; links?: Link[]; addressLines?: string[]; facts?: Fact[] }
type Card = {
	title: string
	text: string[]
	links: Link[]
	bullets: string[]
	listStyle?: 'ordered' | 'unordered'
	listItems?: ListItem[]
	groups?: Group[]
	addressLines?: string[]
	facts?: Fact[]
	image?: string
	imageAlt?: string
	variant?: 'card' | 'plain'
	linkStyle?: 'link' | 'button'
}
type Resource = {
	title: string
	description: string
	cardTitle: string
	cardImage: string
	cardImageAlt: string
	sections: { id: string; title: string; intro: string[]; columns: 1 | 2 | 3; cards: Card[] }[]
}

const resourceFixtureDirectory = new URL('./fixtures/content-contract/resources/', import.meta.url)

const resourceFixture = (name: string): Resource =>
	JSON.parse(readFileSync(new URL(name, resourceFixtureDirectory), 'utf8')) as Resource

const normalizeTypography = (text: string) =>
	text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim()

const expectPublishedRoute = async (page: Page, route: string) => {
	const response = await page.goto(route)
	expect(response, `Missing response for ${route}`).not.toBeNull()
	expect(response!.status(), `Route ${route} must remain public`).toBeLessThan(400)
}

const expectResourceAnchor = async (page: Page, anchor: string, timeout?: number) => {
	const section = page.locator(`main > section#${anchor}`)
	await expect(section, `Missing resource section anchor #${anchor}`).toHaveCount(1, { timeout })
	return section
}

const expectCardTitle = (card: Locator, title: string, timeout?: number) =>
	expect(card.getByRole('heading', { level: 3 }), `Missing resource card ${title}`).toHaveText(title, { timeout })

const expectLinks = async (scope: Locator, links: Link[]) => {
	for (const link of links) {
		await expect(scope.getByRole('link', { name: link.label, exact: true })).toHaveAttribute('href', link.url)
	}
}

const expectFacts = async (scope: Locator, facts: Fact[]) => {
	for (const fact of facts) {
		await expect(scope).toContainText(`${fact.label} ${fact.value}`)
		if (fact.url) {
			await expect(scope.getByRole('link', { name: fact.value, exact: true })).toHaveAttribute('href', fact.url)
		}
	}
}

test('content contract fixture is available', () => {
	expect(contentContract.blogs).toHaveLength(16)
	expect(contentContract.resources).toHaveLength(8)
})

test('every inventoried blog route keeps its title and hero image', async ({ page }) => {
	for (const blog of contentContract.blogs) {
		await expectPublishedRoute(page, blog.route)
		await expect(page.getByRole('heading', { level: 1 })).toHaveText(blog.title)
		const hero = page.getByRole('img', { name: blog.hero.alt, exact: true })
		await expect(hero).toHaveAttribute('src', blog.hero.src)
		await expect(hero).toHaveAttribute('alt', blog.hero.alt)
	}
})

test('every inventoried blog keeps semantic headings, representative text, links, and inline images', async ({
	page
}) => {
	for (const blog of contentContract.blogs) {
		await expectPublishedRoute(page, blog.route)
		await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', blog.description)
		expect(normalizeTypography((await page.locator('main').textContent()) ?? '')).toContain(
			normalizeTypography(blog.bodyText)
		)
		const headings = await page
			.locator('main h2, main h3, main h4')
			.evaluateAll((headings) =>
				headings.map((heading) => ({ level: Number(heading.tagName.slice(1)), text: heading.textContent ?? '' }))
			)
		expect(headings.map(({ level, text }) => ({ level, text: normalizeTypography(text) }))).toEqual(
			blog.headings.map((text, index) => ({ level: blog.headingLevels[index], text: normalizeTypography(text) }))
		)
		for (const link of blog.links) {
			await expect(page.getByRole('link', { name: link.text, exact: true })).toHaveAttribute('href', link.href)
		}
		for (const image of blog.inlineImages ?? []) {
			await expect(page.getByRole('img', { name: image.alt, exact: true })).toHaveAttribute('src', image.src)
		}
	}
})

test('every inventoried resource route keeps sections, cards, links, images, lists, and contact details', async ({
	page
}) => {
	for (const contract of contentContract.resources) {
		const resource = resourceFixture(contract.fixture)
		await expectPublishedRoute(page, contract.route)
		await expect(page.getByRole('heading', { level: 1 })).toHaveText(resource.title)
		await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', resource.description)
		for (const [sectionIndex, section] of resource.sections.entries()) {
			expect(contract.anchors[sectionIndex]).toBe(section.id)
			const sectionLocator = await expectResourceAnchor(page, section.id)
			await expect(sectionLocator.getByRole('heading', { level: 2 })).toHaveText(section.title)
			await expect(page.locator(`nav[aria-label="Quick navigation"] a[href="#${section.id}"]`)).toContainText(
				section.title
			)
			for (const intro of section.intro) {
				await expect(sectionLocator).toContainText(intro)
			}

			const cards = sectionLocator.locator('article')
			await expect(cards).toHaveCount(section.cards.length)
			expect(
				await cards
					.first()
					.locator('..')
					.evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length)
			).toBe(section.columns)
			for (const [cardIndex, card] of section.cards.entries()) {
				const cardLocator = cards.nth(cardIndex)
				await expectCardTitle(cardLocator, card.title)
				for (const text of card.text) {
					await expect(cardLocator).toContainText(text)
				}
				await expectLinks(cardLocator, card.links)
				if (card.imageAlt) {
					await expect(cardLocator.getByRole('img', { name: card.imageAlt, exact: true })).toHaveAttribute(
						'src',
						new RegExp(card.image!.replace(/\.[^.]+$/, ''))
					)
				}
				if (card.bullets.length > 0) {
					await expect(cardLocator.locator(':scope > ul > li')).toContainText(card.bullets)
				}
				if (card.listItems) {
					const list = cardLocator.locator(`:scope > ${card.listStyle === 'ordered' ? 'ol' : 'ul'}`)
					await expect(list.locator(':scope > li')).toHaveCount(card.listItems.length)
					for (const [itemIndex, item] of card.listItems.entries()) {
						const itemLocator = list.locator(':scope > li').nth(itemIndex)
						await expect(itemLocator).toContainText(item.text)
						await expectLinks(itemLocator, item.links ?? [])
						if (item.items) await expect(itemLocator.locator(':scope > ul > li')).toContainText(item.items)
					}
				}
				if ((card.addressLines ?? []).length > 0) {
					await expect(cardLocator.locator('address')).toContainText(card.addressLines!.join(' '))
				}
				await expectFacts(cardLocator, card.facts ?? [])
				for (const group of card.groups ?? []) {
					const groupLocator = cardLocator.locator('section').filter({ hasText: group.title })
					await expect(groupLocator.getByRole('heading', { level: 4, name: group.title, exact: true })).toHaveCount(1)
					for (const text of group.text ?? []) await expect(groupLocator).toContainText(text)
					await expectLinks(groupLocator, group.links ?? [])
					if ((group.addressLines ?? []).length > 0) {
						await expect(groupLocator.locator('address')).toContainText(group.addressLines!.join(' '))
					}
					await expectFacts(groupLocator, group.facts ?? [])
				}
			}
		}
	}
})

test('resource landing cards retain their routes, images, and image descriptions', async ({ page }) => {
	await expectPublishedRoute(page, '/resources/')
	for (const contract of contentContract.resources) {
		const resource = resourceFixture(contract.fixture)
		const card = page.getByRole('link', { name: new RegExp(resource.cardTitle) })
		await expect(card).toHaveAttribute('href', contract.route)
		await expect(card.getByRole('img', { name: resource.cardImageAlt, exact: true })).toHaveAttribute(
			'src',
			new RegExp(resource.cardImage.split('/').at(-1)!.split('.')[0])
		)
	}
})

const visualContracts = [
	{
		name: 'blog-light-wide',
		route: '/blog/biorender-for-students/',
		target: 'main article',
		theme: 'light',
		viewport: { width: 1440, height: 1000 }
	},
	{
		name: 'blog-dark-wide',
		route: '/blog/biorender-for-students/',
		target: 'main article',
		theme: 'dark',
		viewport: { width: 1440, height: 1000 }
	},
	{
		name: 'blog-light-narrow',
		route: '/blog/biorender-for-students/',
		target: 'main article',
		theme: 'light',
		viewport: { width: 390, height: 844 }
	},
	{
		name: 'blog-dark-narrow',
		route: '/blog/biorender-for-students/',
		target: 'main article',
		theme: 'dark',
		viewport: { width: 390, height: 844 }
	},
	{
		name: 'resource-light-wide',
		route: '/resources/housing/',
		target: '#emergency',
		theme: 'light',
		viewport: { width: 1440, height: 1000 }
	},
	{
		name: 'resource-dark-wide',
		route: '/resources/housing/',
		target: '#emergency',
		theme: 'dark',
		viewport: { width: 1440, height: 1000 }
	},
	{
		name: 'resource-light-narrow',
		route: '/resources/housing/',
		target: '#emergency',
		theme: 'light',
		viewport: { width: 390, height: 844 }
	},
	{
		name: 'resource-dark-narrow',
		route: '/resources/housing/',
		target: '#emergency',
		theme: 'dark',
		viewport: { width: 390, height: 844 }
	}
] as const

for (const visual of visualContracts) {
	test(`representative ${visual.name} rendering stays stable`, async ({ page }) => {
		await page.setViewportSize(visual.viewport)
		await page.emulateMedia({ reducedMotion: 'reduce' })
		await page.addInitScript((theme) => localStorage.setItem('grc-theme', theme), visual.theme)
		await page.goto(visual.route)
		await page.addStyleTag({ content: 'header { position: static !important; }' })
		await expect(page.locator(visual.target)).toHaveScreenshot(`${visual.name}.png`, {
			animations: 'disabled',
			caret: 'hide',
			// The link-arrow glyph differs by ~100 antialiased pixels between local and GitHub Linux fonts.
			maxDiffPixels: 120,
			scale: 'css'
		})
	})
}

test('content contracts reject deliberate route, anchor, and content changes', async ({ page }) => {
	await expect(expectPublishedRoute(page, '/blog/not-an-inventoried-route/')).rejects.toThrow()

	await expectPublishedRoute(page, '/resources/housing/')
	const section = page.locator('main > section#emergency')
	await section.evaluate((element) => element.removeAttribute('id'))
	await expect(expectResourceAnchor(page, 'emergency', 100)).rejects.toThrow()

	await expectPublishedRoute(page, '/resources/housing/')
	const card = page.locator('main > section#emergency article').first()
	await card.getByRole('heading', { level: 3 }).evaluate((element) => (element.textContent = 'Changed card title'))
	await expect(expectCardTitle(card, 'Emergency Student Housing Support', 100)).rejects.toThrow()
})
