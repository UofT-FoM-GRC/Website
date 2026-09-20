import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { parse } from 'yaml'

type CmsField = {
	label?: string
	hint?: string
	pattern?: [string, string]
	widget?: string
	field?: CmsField
	fields?: CmsField[]
	types?: CmsField[]
}

const collectFields = (fields: CmsField[] = []): CmsField[] =>
	fields.flatMap((field) => [
		field,
		...collectFields(field.fields),
		...collectFields(field.types),
		...collectFields(field.field ? [field.field] : [])
	])

test('browser guide is linked from the CMS and hidden from public discovery', async ({ page, request }) => {
	await page.goto('/content-editor-guide/')

	await expect(page).toHaveTitle(/Content editor guide/)
	await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow')
	await expect(page.locator('main')).toHaveAttribute('data-pagefind-ignore', '')
	await expect(page.getByRole('heading', { name: 'Content editor guide', level: 1 })).toBeVisible()
	await expect(page.getByText('Sveltia CMS 0.214.1', { exact: true })).toBeVisible()
	await expect(page.locator('nav[aria-label="Main navigation"] a[href="/content-editor-guide/"]')).toHaveCount(0)

	const sitemap = await request.get('/sitemap-0.xml')
	expect(await sitemap.text()).not.toContain('/content-editor-guide/')

	const admin = await request.get('/admin/')
	expect(await admin.text()).toContain('href="/content-editor-guide/"')
})

test('guide covers the complete routine workflow and escalation boundaries', async ({ page }) => {
	await page.goto('/content-editor-guide/')
	const main = page.locator('main')

	for (const heading of [
		'Sign in',
		'Choose a task area',
		'Save a content draft',
		'Validate and review the site preview',
		'Publish',
		'Archive and expiry',
		'Images',
		'Safe practice',
		'When to contact the technical steward'
	]) {
		await expect(main.getByRole('heading', { name: heading })).toBeVisible()
	}

	await expect(main).toContainText('authoritative')
	await expect(main).toContainText('Editor preview')
	await expect(main).toContainText('stable URL')
	await expect(main).toContainText('inactive')
	await expect(main).toContainText('disposable')
	await expect(main).toContainText('Discard Changes')
	await expect(main.getByRole('img')).toHaveCount(3)
	await expect(main).not.toContainText(/pull request|repository|branch|Netlify|Git command/i)
})

test('visible CMS field guidance uses plain domain language', () => {
	const config = parse(readFileSync(new URL('../public/admin/config.yml', import.meta.url), 'utf8')) as {
		collections: Array<{ fields?: CmsField[]; files?: Array<{ fields?: CmsField[] }> }>
	}
	const fields = config.collections.flatMap((collection) => [
		...collectFields(collection.fields),
		...(collection.files ?? []).flatMap((file) => collectFields(file.fields))
	])
	const visibleGuidance = fields
		.filter((field) => field.widget !== 'hidden')
		.flatMap((field) => [field.label, field.hint, field.pattern?.[1]])
		.filter((value): value is string => Boolean(value))
		.join('\n')

	expect(visibleGuidance).not.toMatch(/\b(?:slug|frontmatter|schema|branch|pull request|section id)\b/i)
	expect(visibleGuidance).not.toMatch(/\b(?:Git|GitHub|Netlify)\b/i)
	expect(visibleGuidance).toContain('Search and Sharing Summary')
	expect(visibleGuidance).toContain('Publication Date')
	expect(visibleGuidance).toContain('Categories')
	expect(visibleGuidance).toContain('Image Description')
})
