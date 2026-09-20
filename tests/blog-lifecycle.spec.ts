import { expect, test } from '@playwright/test'
import { createBlogSchema } from '../src/schemas'
import { blogMonthKey, formatBlogMonth, isCurrentPost, isExpiredOn } from '../src/utils/blog'

const publishedPost = {
	data: {
		status: 'current' as const,
		expiresOn: undefined
	}
} as Parameters<typeof isCurrentPost>[0]

test('Toronto calendar expiry keeps posts current through EST and EDT expiry dates', () => {
	const expiry = new Date('2026-01-15T00:00:00.000Z')
	expect(isExpiredOn(expiry, new Date('2026-01-16T04:59:59.000Z'))).toBeFalsy()
	expect(isExpiredOn(expiry, new Date('2026-01-16T05:00:00.000Z'))).toBeTruthy()

	const daylightExpiry = new Date('2026-07-15T00:00:00.000Z')
	expect(isExpiredOn(daylightExpiry, new Date('2026-07-16T03:59:59.000Z'))).toBeFalsy()
	expect(isExpiredOn(daylightExpiry, new Date('2026-07-16T04:00:00.000Z'))).toBeTruthy()
	expect(isCurrentPost(publishedPost, new Date('2026-07-15T12:00:00.000Z'))).toBeTruthy()
	expect(
		isCurrentPost(
			{ data: { status: 'current', expiresOn: daylightExpiry } } as Parameters<typeof isCurrentPost>[0],
			new Date('2026-07-16T04:00:00.000Z')
		)
	).toBeFalsy()
	expect(isCurrentPost({ data: { expiresOn: undefined } } as Parameters<typeof isCurrentPost>[0])).toBeTruthy()
	expect(
		isCurrentPost({ data: { status: 'unexpected', expiresOn: undefined } } as unknown as Parameters<
			typeof isCurrentPost
		>[0])
	).toBeFalsy()
})

test('blog month labels use date-only UTC keys instead of the build host time zone', () => {
	const publication = new Date('2026-03-01T00:00:00.000Z')
	expect(blogMonthKey(publication)).toBe('2026-03')
	expect(formatBlogMonth('2026-03')).toBe('March 2026')
})

test('blog schema rejects tomorrow and expiry before publication with field-specific messages', () => {
	const schema = createBlogSchema(new Date('2026-03-08T16:00:00.000Z'))
	const post = {
		title: 'Lifecycle test',
		description: 'A valid description.',
		pubDate: '2026-03-09',
		tags: ['other']
	}

	const future = schema.safeParse(post)
	expect(future.success).toBeFalsy()
	if (!future.success) {
		expect(future.error.issues).toContainEqual({
			code: 'custom',
			path: ['pubDate'],
			message: 'Publication date cannot be in the future.'
		})
	}
	const current = schema.safeParse({ ...post, pubDate: '2026-03-08' })
	expect(current.success).toBeTruthy()
	if (current.success) expect(current.data.status).toBe('current')

	const invalidStatus = schema.safeParse({ ...post, pubDate: '2026-03-08', status: 'published' })
	expect(invalidStatus.success).toBeFalsy()
	if (!invalidStatus.success) {
		expect(invalidStatus.error.issues).toContainEqual(
			expect.objectContaining({ path: ['status'], message: expect.stringContaining('Invalid option') })
		)
	}

	const expiry = schema.safeParse({ ...post, pubDate: '2026-03-08', expiresOn: '2026-03-07' })
	expect(expiry.success).toBeFalsy()
	if (!expiry.success) {
		expect(expiry.error.issues).toContainEqual({
			code: 'custom',
			path: ['expiresOn'],
			message: 'Expiry must not predate publication.'
		})
	}
})

test('historical blog routes stay public but leave every discovery surface', async ({ page, request }) => {
	await page.goto('/blog/ims-career-mentorship-2024/')
	await expect(page.getByText('Archived post.')).toBeVisible()
	await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow')
	await expect(page.locator('main')).toHaveAttribute('data-pagefind-ignore', '')
	await expect(page.locator('main')).not.toHaveAttribute('data-pagefind-body', '')

	await page.goto('/blog/')
	await expect(page.getByText('IMS Career Mentorship Program 2024-2025')).toHaveCount(0)
	await page.goto('/resources/career-planning-exploration/')
	await expect(page.getByText('IMS Career Mentorship Program 2024-2025')).toHaveCount(0)

	const rss = await request.get('/rss.xml')
	expect(await rss.text()).not.toContain('/blog/ims-career-mentorship-2024/')
	const sitemapIndex = await request.get('/sitemap-index.xml')
	expect(await sitemapIndex.text()).toContain('https://uoftfomgrc.ca/sitemap-0.xml')
	const sitemap = await request.get('/sitemap-0.xml')
	expect(await sitemap.text()).not.toContain('/blog/ims-career-mentorship-2024/')

	const results = await page.evaluate(async () => {
		const pagefind = await new Function('return import("/pagefind/pagefind.js")')()
		const search = await pagefind.search('IMS Career Mentorship Program')
		return Promise.all(search.results.map((result: { data: () => Promise<{ url: string }> }) => result.data()))
	})
	expect(results.map((result) => result.url)).not.toContain('/blog/ims-career-mentorship-2024/')
})

test('current blog routes remain discoverable', async ({ page, request }) => {
	await page.goto('/blog/biorender-for-students/')
	await expect(page.locator('meta[name="robots"]')).toHaveCount(0)
	await expect(page.locator('main')).toHaveAttribute('data-pagefind-body', '')

	const rss = await request.get('/rss.xml')
	expect(await rss.text()).toContain('/blog/biorender-for-students/')
	const sitemap = await request.get('/sitemap-0.xml')
	expect(await sitemap.text()).toContain('/blog/biorender-for-students/')

	const results = await page.evaluate(async () => {
		const pagefind = await new Function('return import("/pagefind/pagefind.js")')()
		const search = await pagefind.search('Biorender Students')
		return Promise.all(search.results.map((result: { data: () => Promise<{ url: string }> }) => result.data()))
	})
	expect(results.map((result) => result.url)).toContain('/blog/biorender-for-students/')
})
