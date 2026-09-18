import { expect, test, type Page } from '@playwright/test'
import { readdirSync, readFileSync } from 'node:fs'
import sharp from 'sharp'
import { parseDocument, stringify } from 'yaml'

const cmsBundle = readFileSync(new URL('../node_modules/@sveltia/cms/dist/sveltia-cms.js', import.meta.url))
const configPath = new URL('../public/admin/config.yml', import.meta.url)
const customizationsPath = new URL('../public/admin/customizations.js', import.meta.url)
const testRepositoryName = 'sveltia-cms-test'

const readContentFiles = () => [
	...readdirSync(new URL('../src/blog/', import.meta.url))
		.filter((name) => name.endsWith('.md'))
		.map(
			(name) => [`src/blog/${name}`, readFileSync(new URL(`../src/blog/${name}`, import.meta.url), 'utf8')] as const
		),
	...readdirSync(new URL('../src/data/resources/', import.meta.url))
		.filter((name) => name.endsWith('.json'))
		.map(
			(name) =>
				[
					`src/data/resources/${name}`,
					readFileSync(new URL(`../src/data/resources/${name}`, import.meta.url), 'utf8')
				] as const
		),
	...['announcements.json', 'homepage.json', 'team.json', 'navigation.json', 'site.json'].map(
		(name) => [`src/data/${name}`, readFileSync(new URL(`../src/data/${name}`, import.meta.url), 'utf8')] as const
	)
]

const readTestFile = async ({ path, testRepositoryName }: { path: string; testRepositoryName: string }) => {
	try {
		const root = await navigator.storage.getDirectory()
		let directory = await root.getDirectoryHandle(testRepositoryName)
		const names = path.split('/')
		const fileName = names.pop()!
		for (const name of names) directory = await directory.getDirectoryHandle(name)
		const file = await (await directory.getFileHandle(fileName)).getFile()
		return await file.text()
	} catch {
		return ''
	}
}

const saveTitle = async (
	page: Page,
	{ area, entry, currentTitle = entry, title }: { area: string; entry: string; currentTitle?: string; title: string }
) => {
	await page.getByRole('treeitem', { name: area, exact: true }).click()
	await page.getByText(entry, { exact: true }).click()
	const titleInput = page.locator('input:visible').first()
	await expect(titleInput).toHaveValue(currentTitle)
	await titleInput.fill(title)
	const save = page.getByRole('button', { name: 'Save' })
	await save.click()
	await expect(page.locator('[data-entry-draft-root]')).toBeHidden()
}

const withoutEmptyValues = <T>(value: T): T => {
	if (Array.isArray(value)) return value.map(withoutEmptyValues) as T
	if (!value || typeof value !== 'object') return value

	return Object.fromEntries(
		Object.entries(value)
			.filter(([, child]) => child !== '' && !(Array.isArray(child) && child.length === 0))
			.map(([key, child]) => [key, withoutEmptyValues(child)])
	) as T
}

const normalizeMarkdownSpacing = (value: string) => value.replace(/\n\s*\n/g, '\n')

const openTestBackend = async (page: Page, sandboxName: string) => {
	const files = readContentFiles()
	const config = parseDocument(readFileSync(configPath, 'utf8')).toJS()
	config.backend = { name: 'test-repo' }
	delete config.publish_mode

	await page.route('https://**', (route) => route.abort())
	await page.route('https://unpkg.com/@sveltia/cms@0.214.1/dist/sveltia-cms.js', (route) =>
		route.fulfill({ body: cmsBundle, contentType: 'application/javascript' })
	)
	await page.route('**/admin/config.yml**', (route) =>
		route.fulfill({ body: stringify(config), contentType: 'text/yaml' })
	)
	await page.route('**/admin/customizations.js', (route) =>
		route.fulfill({ body: readFileSync(customizationsPath, 'utf8'), contentType: 'application/javascript' })
	)
	await page.addInitScript(
		async ({ files, testRepositoryName, sandboxName }) => {
			const getDirectory = navigator.storage.getDirectory.bind(navigator.storage)
			navigator.storage.getDirectory = async () => {
				const root = await getDirectory()
				return root.getDirectoryHandle(sandboxName, { create: true })
			}

			if (sessionStorage.getItem('cms-roundtrip-seeded')) return

			const root = await navigator.storage.getDirectory()
			const testRepository = await root.getDirectoryHandle(testRepositoryName, { create: true })
			for (const [path, content] of files) {
				const names = path.split('/')
				const fileName = names.pop()!
				let directory = testRepository
				for (const name of names) directory = await directory.getDirectoryHandle(name, { create: true })
				const file = await directory.getFileHandle(fileName, { create: true })
				const writer = await file.createWritable()
				await writer.write(content)
				await writer.close()
			}

			sessionStorage.setItem('cms-roundtrip-seeded', 'true')
		},
		{ files, testRepositoryName, sandboxName }
	)

	const parsed = page.waitForEvent('console', {
		predicate: (message) => message.text().includes(`Parsed ${files.length} entries (0 errors)`)
	})
	await page.goto('/admin/')
	await page.getByRole('button', { name: 'Work with Test Repository' }).click()
	await parsed
}

test('test backend opens all existing content and preserves Markdown and JSON entry/file saves', async ({ page }) => {
	const testSandboxName = `cms-roundtrip-${test.info().parallelIndex}-${test.info().repeatEachIndex}`
	const files = readContentFiles()
	const source = Object.fromEntries(files)
	const config = parseDocument(readFileSync(configPath, 'utf8')).toJS()
	config.backend = { name: 'test-repo' }
	delete config.publish_mode

	await page.route('https://**', (route) => route.abort())
	await page.route('https://unpkg.com/@sveltia/cms@0.214.1/dist/sveltia-cms.js', (route) =>
		route.fulfill({ body: cmsBundle, contentType: 'application/javascript' })
	)
	await page.route('**/admin/config.yml**', (route) =>
		route.fulfill({ body: stringify(config), contentType: 'text/yaml' })
	)
	await page.route('**/admin/customizations.js', (route) =>
		route.fulfill({ body: readFileSync(customizationsPath, 'utf8'), contentType: 'application/javascript' })
	)
	await page.clock.install({ time: new Date('2026-01-15T05:00:00.000Z') })
	await page.addInitScript(
		async ({ files, testRepositoryName, testSandboxName }) => {
			const getDirectory = navigator.storage.getDirectory.bind(navigator.storage)
			navigator.storage.getDirectory = async () => {
				const root = await getDirectory()
				return root.getDirectoryHandle(testSandboxName, { create: true })
			}

			if (sessionStorage.getItem('cms-roundtrip-seeded')) return

			const root = await navigator.storage.getDirectory()
			const testRepository = await root.getDirectoryHandle(testRepositoryName, { create: true })

			for (const [path, content] of files) {
				const names = path.split('/')
				const fileName = names.pop()!
				let directory = testRepository
				for (const name of names) directory = await directory.getDirectoryHandle(name, { create: true })
				const file = await directory.getFileHandle(fileName, { create: true })
				const writer = await file.createWritable()
				await writer.write(content)
				await writer.close()
			}

			sessionStorage.setItem('cms-roundtrip-seeded', 'true')
		},
		{ files, testRepositoryName, testSandboxName }
	)

	const parsed = page.waitForEvent('console', {
		predicate: (message) => message.text().includes(`Parsed ${files.length} entries (0 errors)`)
	})
	await page.goto('/admin/')
	await page.getByRole('button', { name: 'Work with Test Repository' }).click()
	await parsed

	const original = source['src/blog/biorender-for-students.md']
	const [, originalFrontMatter, originalBody] = original.match(/^---\n([\s\S]*?)\n---\n([\s\S]+)$/) ?? []
	const originalData = parseDocument(originalFrontMatter).toJS()
	const title = `${originalData.title} round trip`

	await page.getByText(new RegExp(`^${originalData.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} — `)).click()
	const titleInput = page.locator('input:visible').first()
	await expect(titleInput).toHaveValue(originalData.title)
	await titleInput.fill(title)
	const save = page.getByRole('button', { name: 'Save' })
	await save.click()
	await expect(page.locator('[data-entry-draft-root]')).toBeHidden()

	const savedFile = () =>
		page.evaluate(readTestFile, { path: 'src/blog/biorender-for-students.md', testRepositoryName })
	await expect.poll(savedFile).toContain(`title: ${title}`)
	const saved = await savedFile()
	const [, savedFrontMatter, savedBody] = saved.match(/^---\n([\s\S]*?)\n---\n([\s\S]+)$/) ?? []
	const savedData = parseDocument(savedFrontMatter).toJS()

	expect(savedData).toMatchObject({ ...originalData, title, updatedDate: '2026-01-15' })
	expect(normalizeMarkdownSpacing(savedBody)).toBe(normalizeMarkdownSpacing(originalBody))

	const resourcePath = 'src/data/resources/employment.json'
	const resource = JSON.parse(source[resourcePath])
	const resourceTitle = `${resource.title} round trip`
	await saveTitle(page, { area: 'Resource Pages', entry: resource.title, title: resourceTitle })
	const savedResourceFile = () => page.evaluate(readTestFile, { path: resourcePath, testRepositoryName })
	await expect.poll(savedResourceFile).toContain(`"title": "${resourceTitle}"`)
	expect(JSON.parse(await savedResourceFile())).toMatchObject({ ...withoutEmptyValues(resource), title: resourceTitle })
	expect(JSON.parse(await savedResourceFile())).not.toHaveProperty('updatedDate')

	const teamPath = 'src/data/team.json'
	const team = JSON.parse(source[teamPath])
	const teamTitle = `${team.about.title} round trip`
	await saveTitle(page, {
		area: 'Team and About Page',
		entry: 'About Page and Team Archive',
		currentTitle: team.about.title,
		title: teamTitle
	})
	const savedTeamFile = () => page.evaluate(readTestFile, { path: teamPath, testRepositoryName })
	await expect.poll(savedTeamFile).toContain(`"title": "${teamTitle}"`)
	expect(JSON.parse(await savedTeamFile())).toMatchObject({
		...withoutEmptyValues(team),
		about: { ...withoutEmptyValues(team.about), title: teamTitle }
	})

	await page.reload()
	await page.getByRole('treeitem', { name: 'Blog Posts', exact: true }).click()
	await expect(page.getByText(new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} — `))).toBeVisible()

	await page.getByLabel('Create New Entry').first().click()
	const newTitle = page.getByText('Title', { exact: true }).locator('xpath=following::input[@type="text"][1]')
	const newPublicationDate = page
		.getByText('Publish Date', { exact: true })
		.locator('xpath=following::input[@type="date"][1]')
	await page.getByRole('combobox').click()
	await page.getByText('Other', { exact: true }).last().click()
	await expect(newPublicationDate).toHaveValue('2026-01-15')
	await newTitle.fill('New lifecycle post')
	await page.locator('textarea:visible').first().fill('New post description.')
	await newPublicationDate.fill('2026-01-15')
	await page.locator('[contenteditable="true"]').fill('New post body.')
	await expect(newTitle).toHaveValue('New lifecycle post')
	await expect(newPublicationDate).toHaveValue('2026-01-15')
	await page.getByRole('button', { name: 'Save' }).click()
	await expect(page.locator('[data-entry-draft-root]')).toBeHidden()

	const newBlog = await page.evaluate(readTestFile, { path: 'src/blog/new-lifecycle-post.md', testRepositoryName })
	expect(parseDocument(newBlog).toJS()).not.toHaveProperty('updatedDate')
})

test('offline pinned Sveltia exposes only the semantic blog insert controls', async ({ page }) => {
	await openTestBackend(page, `cms-semantic-controls-${test.info().parallelIndex}-${test.info().repeatEachIndex}`)
	await page.getByText(/^UofT Zoom Pro — /).click()

	const body = page.locator('[data-key-path="body"]')
	await expect(body.getByRole('button', { name: 'Insert' })).toBeVisible()
	await body.getByRole('button', { name: 'Insert' }).click()
	await expect(page.getByRole('menuitem', { name: 'Accessible image' })).toBeVisible()
	await expect(page.getByRole('menuitem', { name: 'Callout' })).toBeVisible()
	await expect(page.getByRole('menuitem', { name: 'Action link' })).toBeVisible()
	await expect(page.getByRole('menuitem', { name: /image/i })).toHaveCount(1)
	await expect(page.getByRole('menuitem', { name: /code/i })).toHaveCount(0)
	await expect(page.getByRole('menuitem', { name: /quote/i })).toHaveCount(0)

	await page.getByRole('menuitem', { name: 'Callout' }).click()
	await expect(page.getByRole('dialog')).toBeVisible()
	await expect(page.getByRole('radiogroup', { name: 'Callout Kind' }).last()).toBeVisible()
	await expect(page.getByRole('textbox', { name: 'Callout Message' }).last()).toBeVisible()
	await expect(page.getByRole('dialog').getByRole('button', { name: 'Insert' })).toHaveCount(0)
	await page.getByRole('textbox', { name: 'Optional Heading' }).last().fill('Before you host')
	await page.getByRole('textbox', { name: 'Callout Message' }).last().fill('Pilot callout message.')

	await body.getByRole('button', { name: 'Insert' }).click()
	await page.getByRole('menuitem', { name: 'Action link' }).click()
	await page.getByRole('textbox', { name: 'Link Text' }).last().fill('Open the guide')
	await page.getByRole('textbox', { name: 'Destination URL' }).last().fill('/guide/')
	await page.getByRole('textbox', { name: 'Optional Supporting Text' }).last().fill('Read this before hosting.')

	await page.getByRole('button', { name: 'Save' }).click()
	await expect(page.locator('[data-entry-draft-root]')).toBeHidden()

	const saved = () => page.evaluate(readTestFile, { path: 'src/blog/uoft-zoom-pro.md', testRepositoryName })
	await expect.poll(saved).toContain(':::callout{kind="information" title="Before you host"}')
	await expect.poll(saved).toContain(':::action-link{url="/guide/" label="Open the guide"}')

	await page.reload()
	await page.getByText(/^UofT Zoom Pro — /).click()
	await expect(page.getByRole('textbox', { name: 'Optional Heading' }).last()).toHaveValue('Before you host')
	await expect(page.getByRole('textbox', { name: 'Link Text' }).last()).toHaveValue('Open the guide')

	await body.getByRole('button', { name: 'Insert' }).click()
	await page.getByRole('menuitem', { name: 'Accessible image' }).click()
	await expect(page.getByRole('textbox', { name: 'Image Description' }).last()).toBeVisible()
	const imageInput = page.locator('input[type="file"]').last()
	const imageField = imageInput.locator('xpath=ancestor::*[contains(@class, "field")][1]')
	await imageField.getByRole('button', { name: 'Browse' }).click()
	const assetDialog = page.getByRole('dialog', { name: 'Select Image' })
	const fileChooser = page.waitForEvent('filechooser')
	await assetDialog.getByRole('button', { name: 'Upload' }).click()
	await (
		await fileChooser
	).setFiles({
		name: 'Semantic callout diagram.png',
		mimeType: 'image/png',
		buffer: await sharp({ create: { width: 2, height: 2, channels: 3, background: { r: 28, g: 82, b: 128 } } })
			.png()
			.toBuffer()
	})
	await assetDialog.getByRole('button', { name: 'Insert' }).click()
	await expect(assetDialog).toBeHidden()
	await page
		.getByRole('textbox', { name: 'Image Description' })
		.last()
		.fill('Diagram showing a callout beside an action link.')

	await page.getByRole('button', { name: 'Save' }).click()
	await expect(page.locator('[data-entry-draft-root]')).toBeHidden()
	await expect
		.poll(saved)
		.toContain(
			':accessible-image{src="/assets/semantic-callout-diagram.webp" description="Diagram showing a callout beside an action link."}'
		)
	await expect.poll(saved).not.toMatch(/<[^>]+>/)

	await page.reload()
	await page.getByText(/^UofT Zoom Pro — /).click()
	const reloadedImage = page.getByRole('group', { name: 'Accessible image' }).last()
	await expect(reloadedImage.getByRole('textbox', { name: 'Image Description' })).toHaveValue(
		'Diagram showing a callout beside an action link.'
	)
	await expect(reloadedImage.getByRole('textbox', { name: 'Image', exact: true })).toContainText(
		'/assets/semantic-callout-diagram.webp'
	)

	await body.getByRole('button', { name: 'Insert' }).click()
	await page.getByRole('menuitem', { name: 'Action link' }).click()
	const invalidUrl = page.getByRole('textbox', { name: 'Destination URL' }).last()
	await invalidUrl.fill('javascript:alert(1)')
	await page.getByRole('button', { name: 'Save' }).click()
	await expect(page.locator('[data-entry-draft-root]')).toBeVisible()
})
