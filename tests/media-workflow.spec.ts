import { expect, test, type Page } from '@playwright/test'
import { readdirSync, readFileSync } from 'node:fs'
import sharp from 'sharp'
import { parseDocument, stringify } from 'yaml'
import { blogSchema, resourceSchema, teamSchema } from '../src/schemas'

const cmsBundle = readFileSync(new URL('../node_modules/@sveltia/cms/dist/sveltia-cms.js', import.meta.url))
const configPath = new URL('../public/admin/config.yml', import.meta.url)
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

const readTestAsset = async ({ path, testRepositoryName }: { path: string; testRepositoryName: string }) => {
	const root = await navigator.storage.getDirectory()
	let directory = await root.getDirectoryHandle(testRepositoryName)
	const names = path.split('/')
	const name = names.pop()!
	for (const segment of names) directory = await directory.getDirectoryHandle(segment)
	const file = await (await directory.getFileHandle(name)).getFile()
	const bytes = new Uint8Array(await file.arrayBuffer())
	let binary = ''
	for (const byte of bytes) binary += String.fromCodePoint(byte)
	return { name: file.name, type: file.type, base64: btoa(binary) }
}

const openTestRepository = async (page: Page, sandboxName: string) => {
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
	await page.addInitScript(
		async ({ files, testRepositoryName, sandboxName }) => {
			const getDirectory = navigator.storage.getDirectory.bind(navigator.storage)
			navigator.storage.getDirectory = async () => {
				const root = await getDirectory()
				return root.getDirectoryHandle(sandboxName, { create: true })
			}

			if (sessionStorage.getItem('cms-media-seeded')) return
			const root = await navigator.storage.getDirectory()
			const repository = await root.getDirectoryHandle(testRepositoryName, { create: true })
			for (const [path, content] of files) {
				const names = path.split('/')
				const fileName = names.pop()!
				let directory = repository
				for (const name of names) directory = await directory.getDirectoryHandle(name, { create: true })
				const file = await directory.getFileHandle(fileName, { create: true })
				const writer = await file.createWritable()
				await writer.write(content)
				await writer.close()
			}
			sessionStorage.setItem('cms-media-seeded', 'true')
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

const openEmploymentResource = async (page: Page) => {
	await page.getByRole('treeitem', { name: 'Resource Pages', exact: true }).click()
	await page.getByText('Employment Resources', { exact: true }).click()
}

const saveResourceImage = async (
	page: Page,
	file: { name: string; mimeType: string; buffer: Buffer },
	description: string
) => {
	await page.locator('[data-key-path="cardImage"] input[type="file"]').first().setInputFiles(file)
	await page.getByRole('textbox', { name: 'Resource Card Image Description', exact: true }).fill(description)
	await page.getByRole('button', { name: 'Save' }).click()
	await expect(page.locator('[data-entry-draft-root]')).toBeHidden()
}

const expectSavedResourceImage = async (
	page: Page,
	{
		assetName,
		description,
		dimensions,
		testRepositoryName
	}: {
		assetName: string
		description: string
		dimensions: { width: number; height: number }
		testRepositoryName: string
	}
) => {
	const resource = () => page.evaluate(readTestFile, { path: 'src/data/resources/employment.json', testRepositoryName })
	await expect.poll(resource).toContain(assetName)
	expect(JSON.parse(await resource())).toMatchObject({
		cardImage: `/assets/${assetName}`,
		cardImageAlt: description
	})

	const asset = await page.evaluate(readTestAsset, {
		path: `public/assets/${assetName}`,
		testRepositoryName
	})
	expect(asset).toMatchObject({ name: assetName, type: 'image/webp' })
	expect(await sharp(Buffer.from(asset.base64, 'base64')).metadata()).toMatchObject({
		format: 'webp',
		...dimensions
	})
}

test('test-backend CMS normalizes uploaded JPEG, PNG, and WebP images and persists the visitor-facing image description', async ({
	page
}) => {
	const sandboxName = `cms-media-${test.info().parallelIndex}-${test.info().repeatEachIndex}`
	await openTestRepository(page, sandboxName)
	await openEmploymentResource(page)

	const wideJpeg = await sharp({
		create: { width: 4096, height: 1024, channels: 3, background: { r: 28, g: 82, b: 128 } }
	})
		.jpeg({ quality: 100 })
		.toBuffer()
	await saveResourceImage(
		page,
		{ name: 'Graduate Research Showcase (2026).JPG', mimeType: 'image/jpeg', buffer: wideJpeg },
		'Graduate researchers presenting posters.'
	)

	await expectSavedResourceImage(page, {
		assetName: 'graduate-research-showcase-2026.webp',
		description: 'Graduate researchers presenting posters.',
		dimensions: { width: 2048, height: 512 },
		testRepositoryName
	})

	await page.reload()
	await openEmploymentResource(page)
	await expect(page.locator('[data-key-path="cardImage"] [role="textbox"]')).toHaveText(
		'/assets/graduate-research-showcase-2026.webp'
	)
	await expect(page.getByRole('textbox', { name: 'Resource Card Image Description', exact: true })).toHaveValue(
		'Graduate researchers presenting posters.'
	)

	const smallPng = await sharp({
		create: { width: 800, height: 600, channels: 3, background: { r: 84, g: 138, b: 62 } }
	})
		.png()
		.toBuffer()
	await saveResourceImage(
		page,
		{ name: 'Small Campus Map.png', mimeType: 'image/png', buffer: smallPng },
		'A campus map.'
	)

	await expectSavedResourceImage(page, {
		assetName: 'small-campus-map.webp',
		description: 'A campus map.',
		dimensions: { width: 800, height: 600 },
		testRepositoryName
	})

	await page.reload()
	await openEmploymentResource(page)
	const existingWebp = await sharp({
		create: { width: 1200, height: 900, channels: 3, background: { r: 108, g: 75, b: 153 } }
	})
		.webp({ quality: 100 })
		.toBuffer()
	await saveResourceImage(
		page,
		{ name: 'Already Optimized Image.WEBP', mimeType: 'image/webp', buffer: existingWebp },
		'An already WebP campus image.'
	)

	await expectSavedResourceImage(page, {
		assetName: 'already-optimized-image.webp',
		description: 'An already WebP campus image.',
		dimensions: { width: 1200, height: 900 },
		testRepositoryName
	})
})

test('team member image descriptions allow empty CMS values and report the nested member path', () => {
	const baseTeam = {
		about: {
			title: 'About',
			description: 'Description',
			heroImage: '/assets/about.webp',
			heroImageAlt: 'Students meeting',
			purposeTitle: 'Purpose',
			purposeParagraphs: ['Purpose paragraph'],
			objectives: ['Objective'],
			workTitle: 'Work',
			workParagraphs: ['Work paragraph']
		},
		years: [{ year: '2026 - 2027', current: true, members: [{ name: 'Photo-free member', position: 'Member' }] }]
	}

	expect(teamSchema.safeParse(baseTeam).success).toBeTruthy()
	const result = teamSchema.safeParse({
		...baseTeam,
		years: [
			{
				...baseTeam.years[0],
				members: [{ name: 'Photographed member', position: 'Member', image: '/assets/member.webp', imageAlt: '' }]
			}
		]
	})
	expect(result.success).toBeFalsy()
	if (!result.success) {
		expect(result.error.issues).toContainEqual(
			expect.objectContaining({
				path: ['years', 0, 'members', 0, 'imageAlt'],
				message: 'Image description is required when an image is set.'
			})
		)
	}
})

test('optional CMS image pairs accept empty values and report exact nested resource-card paths', () => {
	const blog = {
		title: 'Image pair test',
		description: 'A test post.',
		pubDate: '2026-09-17',
		tags: ['other']
	}
	expect(blogSchema.safeParse({ ...blog, heroImage: '', heroImageAlt: '' }).success).toBeTruthy()
	expect(blogSchema.safeParse({ ...blog, heroImage: '/assets/test.webp' }).success).toBeFalsy()

	const resource = {
		slug: 'other',
		title: 'Image pair resource',
		description: 'A test resource.',
		cardTitle: 'Image pair card',
		cardImage: '/assets/card.webp',
		cardImageAlt: 'A card image.',
		sections: [{ id: 'section', title: 'Section', cards: [{ title: 'Optional image card' }] }]
	}
	expect(resourceSchema.safeParse(resource).success).toBeTruthy()
	const result = resourceSchema.safeParse({
		...resource,
		sections: [
			{ ...resource.sections[0], cards: [{ title: 'Optional image card', image: '/assets/test.webp', imageAlt: '' }] }
		]
	})
	expect(result.success).toBeFalsy()
	if (!result.success) {
		expect(result.error.issues).toContainEqual(
			expect.objectContaining({
				path: ['sections', 0, 'cards', 0, 'imageAlt'],
				message: 'Image description is required when an image is set.'
			})
		)
	}
})

test('existing repository-backed image paths still render on public routes', async ({ page }) => {
	await page.goto('/blog/biorender-for-students/')
	await expect(page.getByRole('img', { name: 'BioRender logo', exact: true })).toHaveAttribute('src', /biorenderlogo/)

	await page.goto('/resources/')
	await expect(page.getByRole('img', { name: 'Employment resources', exact: true })).toHaveAttribute(
		'src',
		'/assets/uoft-placeholder-default.webp'
	)
})

test('CMS gives plain-language errors for excessive and unsupported image uploads', async ({ page }) => {
	const sandboxName = `cms-media-limit-${test.info().parallelIndex}-${test.info().repeatEachIndex}`
	await openTestRepository(page, sandboxName)
	await openEmploymentResource(page)

	await page
		.locator('[data-key-path="cardImage"] input[type="file"]')
		.first()
		.setInputFiles({
			name: 'too-large-upload.bin',
			mimeType: 'application/octet-stream',
			buffer: Buffer.alloc(10 * 1024 * 1024 + 1)
		})

	const error = page.getByRole('alertdialog')
	await expect(error).toHaveAccessibleName('Large File')
	await expect(error).toContainText(/exceeds the maximum size/i)
	await error.getByRole('button', { name: 'OK' }).click()
	await expect(error).toBeHidden()

	await page
		.locator('[data-key-path="cardImage"] input[type="file"]')
		.first()
		.setInputFiles({
			name: 'not-an-image.jpeg',
			mimeType: 'image/jpeg',
			buffer: Buffer.from('This is not a JPEG image.')
		})
	await expect(error).toHaveAccessibleName('Invalid File')
	await expect(error).toContainText(/content doesn’t match its file extension/i)
})
