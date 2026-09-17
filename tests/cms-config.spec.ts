import { expect, test } from '@playwright/test'
import Ajv from 'ajv'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseDocument } from 'yaml'
import { cmsFieldContract } from './fixtures/cms-field-contract'

const sveltiaVersion = '0.214.1'

type Field = {
	name: string
	widget?: string
	required?: boolean
	accept?: string
	options?: unknown[]
	field?: Field
	fields?: Field[]
}

type Collection = {
	name: string
	label: string
	folder?: string
	extension?: string
	format?: string
	preview_path?: string
	fields?: Field[]
	files?: Array<{ name: string; file: string; preview_path?: string; fields: Field[] }>
}

type Config = {
	backend: Record<string, unknown>
	publish_mode: string
	site_url: string
	editor: { preview: boolean }
	output: { omit_empty_optional_fields: boolean }
	media_libraries?: {
		default?: {
			config?: {
				max_file_size?: number
				slugify_filename?: boolean
				transformations?: {
					raster_image?: { format?: string; quality?: number; width?: number; height?: number }
				}
			}
		}
	}
	collections: Collection[]
}

const root = new URL('..', import.meta.url)
const configPath = new URL('../public/admin/config.yml', import.meta.url)
const sveltiaPackagePath = new URL('../node_modules/@sveltia/cms/package.json', import.meta.url)
const sveltiaSchemaPath = new URL('../node_modules/@sveltia/cms/schema/sveltia-cms.json', import.meta.url)
const resourceCategories = [
	{ label: 'Employment', value: 'employment' },
	{ label: 'Career Planning & Exploration', value: 'career-planning-exploration' },
	{ label: 'Continuing Education', value: 'continuing-education' },
	{ label: 'Health & Wellness', value: 'health-wellness' },
	{ label: 'Housing', value: 'housing' },
	{ label: 'Scholarships, Bursaries & Awards', value: 'scholarships-bursaries-awards' },
	{ label: 'Scholarship/Award/Grant Application Support', value: 'scholarship-award-grant-application-support' },
	{ label: 'Other', value: 'other' }
]

const readConfig = () => {
	const source = readFileSync(configPath, 'utf8')
	const document = parseDocument(source, { uniqueKeys: true })
	expect(document.errors).toEqual([])
	return { source, config: document.toJS() as Config }
}

test('configuration conforms to the pinned Sveltia schema', () => {
	const { config } = readConfig()
	const sveltiaPackage = JSON.parse(readFileSync(sveltiaPackagePath, 'utf8')) as { version: string }
	const schema = JSON.parse(readFileSync(sveltiaSchemaPath, 'utf8'))
	const validate = new Ajv({ allErrors: true, strict: false, logger: false }).compile(schema)

	expect(sveltiaPackage.version).toBe(sveltiaVersion)
	expect(validate(config), JSON.stringify(validate.errors)).toBeTruthy()
})

const getCollection = (config: Config, name: string) => {
	const collection = config.collections.find((candidate) => candidate.name === name)
	expect(collection, `Missing ${name} task area`).toBeDefined()
	return collection!
}

const getField = (fields: Field[], name: string) => {
	const field = fields.find((candidate) => candidate.name === name)
	expect(field, `Missing ${name} field`).toBeDefined()
	return field!
}

const fieldShape = (fields: Field[]): Record<string, unknown> =>
	Object.fromEntries(
		fields.map(({ name, widget = 'string', fields: nestedFields, field }) => [
			name,
			nestedFields ? fieldShape(nestedFields) : field ? fieldShape([field]) : widget
		])
	)

const expectDataFields = (value: unknown, fields: Field[]) => {
	if (Array.isArray(value)) {
		for (const item of value) expectDataFields(item, fields)
		return
	}
	if (value === null || typeof value !== 'object') return

	for (const [name, child] of Object.entries(value)) {
		const field = getField(fields, name)
		if (field.fields) expectDataFields(child, field.fields)
		if (field.field) expectDataFields(child, [field.field])
	}
}

test('Sveltia foundation has the reviewed GitHub editorial workflow settings', () => {
	const { config } = readConfig()

	expect(config.backend).toMatchObject({
		name: 'github',
		repo: 'UofT-FoM-GRC/Website',
		branch: 'main',
		auth_methods: ['oauth']
	})
	expect(config.backend).not.toHaveProperty('automatic_deployments')
	expect(config.backend).not.toHaveProperty('skip_ci')
	expect(config.publish_mode).toBe('editorial_workflow')
	expect(config.site_url).toBe('https://uoftfomgrc.ca')
	expect(config.editor).toEqual({ preview: false })
	expect(config.output).toEqual({ omit_empty_optional_fields: true })
})

test('Sveltia normalizes routine raster uploads in repository media', () => {
	const { config } = readConfig()

	expect(config.media_libraries).toEqual({
		default: {
			config: {
				max_file_size: 10 * 1024 * 1024,
				slugify_filename: true,
				transformations: {
					raster_image: { format: 'webp', quality: 85, width: 2048, height: 2048 }
				}
			}
		}
	})
})

test('every CMS image field accepts routine raster formats and has an image-description partner', () => {
	const { config } = readConfig()
	const imageFields: Array<{ fields: Field[]; image: string; description: string; imageRequired: boolean }> = [
		{
			fields: getCollection(config, 'blog').fields!,
			image: 'heroImage',
			description: 'heroImageAlt',
			imageRequired: false
		},
		{
			fields: getCollection(config, 'resources').fields!,
			image: 'cardImage',
			description: 'cardImageAlt',
			imageRequired: true
		},
		{
			fields: getField(getField(getCollection(config, 'resources').fields!, 'sections').fields!, 'cards').fields!,
			image: 'image',
			description: 'imageAlt',
			imageRequired: false
		},
		{
			fields: getField(getCollection(config, 'homepage').files![0].fields, 'hero').fields!,
			image: 'image',
			description: 'imageAlt',
			imageRequired: true
		},
		{
			fields: getField(getCollection(config, 'homepage').files![0].fields, 'featureSections').fields!,
			image: 'image',
			description: 'imageAlt',
			imageRequired: true
		},
		{
			fields: getField(getCollection(config, 'team_and_about').files![0].fields, 'about').fields!,
			image: 'heroImage',
			description: 'heroImageAlt',
			imageRequired: true
		},
		{
			fields: getField(getField(getCollection(config, 'team_and_about').files![0].fields, 'years').fields!, 'members')
				.fields!,
			image: 'image',
			description: 'imageAlt',
			imageRequired: false
		}
	]

	for (const { fields, image, description, imageRequired } of imageFields) {
		expect(getField(fields, image)).toMatchObject({
			widget: 'image',
			required: imageRequired,
			accept: 'image/jpeg,image/png,image/webp'
		})
		expect(getField(fields, description)).toMatchObject({
			widget: 'string',
			required: imageRequired
		})
	}
})

test('Sveltia exposes task areas and route-specific site previews', () => {
	const { config } = readConfig()

	expect(config.collections.map(({ label }) => label)).toEqual([
		'Blog Posts',
		'Resource Pages',
		'Homepage Announcements',
		'Homepage',
		'Team and About Page',
		'Advanced Site Settings'
	])
	expect(getCollection(config, 'blog').preview_path).toBe('/blog/{{slug}}/')
	expect(getCollection(config, 'resources').preview_path).toBe('/resources/{{slug}}/')

	for (const [collectionName, fileName, path] of [
		['homepage_announcements', 'announcements', '/'],
		['homepage', 'homepage', '/'],
		['team_and_about', 'team', '/about/'],
		['advanced_site_settings', 'navigation', '/'],
		['advanced_site_settings', 'site', '/']
	] as const) {
		const collection = getCollection(config, collectionName)
		const file = collection.files?.find((candidate) => candidate.name === fileName)
		expect(file, `Missing ${fileName} configuration`).toBeDefined()
		expect(file!.preview_path).toBe(path)
	}
})

test('Sveltia task areas retain current file paths and data field trees', () => {
	const { source, config } = readConfig()

	expect(source).toContain('fields: &resource_fields')
	const blog = getCollection(config, 'blog')
	expect(blog).toMatchObject({ folder: 'src/blog', extension: 'md', format: 'frontmatter' })
	expect(fieldShape(blog.fields!)).toEqual(cmsFieldContract.blog)
	for (const fileName of readdirSync(new URL('../src/blog/', import.meta.url)).filter((name) => name.endsWith('.md'))) {
		const source = readFileSync(new URL(`../src/blog/${fileName}`, import.meta.url), 'utf8')
		const [, frontMatter, body] = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]+)$/) ?? []
		expect(frontMatter, `Missing front matter in ${fileName}`).toBeDefined()
		expect(body, `Missing Markdown body in ${fileName}`).toBeTruthy()
		expectDataFields(parseDocument(frontMatter).toJS(), blog.fields!)
	}

	const resources = getCollection(config, 'resources')
	expect(resources).toMatchObject({ folder: 'src/data/resources', extension: 'json', format: 'json' })
	expect(fieldShape(resources.fields!)).toEqual(cmsFieldContract.resources)
	expect(getField(blog.fields!, 'tags').options).toEqual(resourceCategories)
	for (const fileName of readdirSync(new URL('../src/data/resources/', import.meta.url))) {
		const data = JSON.parse(readFileSync(new URL(`../src/data/resources/${fileName}`, import.meta.url), 'utf8'))
		expect(data.slug).toBe(fileName.replace(/\.json$/, ''))
		expectDataFields(data, resources.fields!)
	}

	for (const [collectionName, fileName, dataPath] of [
		['homepage_announcements', 'announcements', 'src/data/announcements.json'],
		['homepage', 'homepage', 'src/data/homepage.json'],
		['team_and_about', 'team', 'src/data/team.json'],
		['advanced_site_settings', 'navigation', 'src/data/navigation.json'],
		['advanced_site_settings', 'site', 'src/data/site.json']
	] as const) {
		const collection = getCollection(config, collectionName)
		const file = collection.files?.find((candidate) => candidate.name === fileName)
		expect(file?.file).toBe(dataPath)
		expect(existsSync(join(root.pathname, dataPath))).toBeTruthy()
		expect(fieldShape(file!.fields)).toEqual(cmsFieldContract[fileName])
		expectDataFields(JSON.parse(readFileSync(join(root.pathname, dataPath), 'utf8')), file!.fields)
	}

	const navigation = getCollection(config, 'advanced_site_settings').files?.find(({ name }) => name === 'navigation')
	expect(getField(getField(navigation!.fields, 'resourceLinks').fields!, 'slug').options).toEqual(resourceCategories)
})

test('admin loads only the pinned Sveltia editor asset', () => {
	const index = readFileSync(new URL('../public/admin/index.html', import.meta.url), 'utf8')
	const config = readFileSync(configPath, 'utf8')

	expect(index).toContain(`https://unpkg.com/@sveltia/cms@${sveltiaVersion}/dist/sveltia-cms.js`)
	expect(config).toContain(`https://unpkg.com/@sveltia/cms@${sveltiaVersion}/schema/sveltia-cms.json`)
	expect(index).not.toContain('decap-cms')
	expect(index).not.toContain('identity.netlify.com')
})

test('built static site serves the admin shell and configuration without loading the CDN asset', async ({
	request
}) => {
	const index = await request.get('/admin/')
	expect(index).toBeOK()
	expect(await index.text()).toContain(`https://unpkg.com/@sveltia/cms@${sveltiaVersion}/dist/sveltia-cms.js`)

	const config = await request.get('/admin/config.yml')
	expect(config).toBeOK()
	expect(await config.text()).toContain('name: github')
})
