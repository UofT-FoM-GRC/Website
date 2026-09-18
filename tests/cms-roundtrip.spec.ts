import { expect, test, type Page } from '@playwright/test'
import { readdirSync, readFileSync } from 'node:fs'
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
