import { expect, test } from '@playwright/test'
import Ajv from 'ajv'
import { z } from 'astro/zod'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { runInNewContext } from 'node:vm'
import { parseDocument } from 'yaml'
import { blogTagSchema } from '../src/schemas'
import { generateSectionAnchor } from '../src/utils/strings'
import { cmsFieldContract } from './fixtures/cms-field-contract'
import { getCollection, getField, readCmsConfig as readConfig, type Field } from './fixtures/cms-config'

const sveltiaVersion = '0.214.1'

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

test('configuration conforms to the pinned Sveltia schema', () => {
	const { config } = readConfig()
	const sveltiaPackage = JSON.parse(readFileSync(sveltiaPackagePath, 'utf8')) as { version: string }
	const schema = JSON.parse(readFileSync(sveltiaSchemaPath, 'utf8'))
	const validate = new Ajv({ allErrors: true, strict: false, logger: false }).compile(schema)

	expect(sveltiaPackage.version).toBe(sveltiaVersion)
	expect(validate(config), JSON.stringify(validate.errors)).toBeTruthy()
})

const getResourceFile = (config: ReturnType<typeof readConfig>['config'], name: string) => {
	const file = getCollection(config, 'resources').files?.find((candidate) => candidate.name === name)
	expect(file, `Missing ${name} resource page`).toBeDefined()
	return file!
}

const fieldShape = (fields: Field[]): Record<string, unknown> =>
	Object.fromEntries(
		fields.map(({ name, widget = 'string', fields: nestedFields, field, types }) => [
			name,
			types
				? {
						types: Object.fromEntries(types.map((type) => [type.name, type.fields ? fieldShape(type.fields) : widget]))
					}
				: nestedFields
					? fieldShape(nestedFields)
					: field
						? fieldShape([field])
						: widget
		])
	)

const expectDataFields = (value: unknown, fields: Field[]) => {
	if (Array.isArray(value)) {
		for (const item of value) expectDataFields(item, fields)
		return
	}
	if (value === null || typeof value !== 'object') return

	for (const [name, child] of Object.entries(value)) {
		if (name === 'type') continue
		const field = getField(fields, name)
		if (field.types) {
			const items = Array.isArray(child) ? child : [child]
			for (const item of items) {
				if (!item || typeof item !== 'object' || !('type' in item)) continue
				const typeName = String((item as { type: string }).type)
				const typeField = field.types.find((candidate) => candidate.name === typeName)
				expect(typeField, `Missing CMS type ${typeName} for ${field.name}`).toBeDefined()
				expectDataFields(item, typeField!.fields ?? [])
			}
			continue
		}
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

test('generated entry URLs and branches use unambiguous ASCII slugs', () => {
	const { config } = readConfig()

	expect(config.slug).toEqual({
		encoding: 'ascii',
		clean_accents: true,
		sanitize_replacement: '-',
		trim: true,
		lowercase: true
	})
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
			fields: getResourceFile(config, 'employment').fields,
			image: 'cardImage',
			description: 'cardImageAlt',
			imageRequired: true
		},
		{
			fields: getField(
				getField(getField(getResourceFile(config, 'employment').fields, 'sections').fields!, 'cards').fields!,
				'blocks'
			).types!.find((type) => type.name === 'image')!.fields!,
			image: 'image',
			description: 'imageAlt',
			imageRequired: true
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

test('Team and About selects one required current year instead of per-year booleans', () => {
	const { config } = readConfig()
	const fields = getCollection(config, 'team_and_about').files![0].fields!
	const years = getField(fields, 'years')

	expect(getField(fields, 'currentYear')).toMatchObject({ widget: 'string', required: true })
	expect(getField(fields, 'currentYear').hint).toContain('match one of the Team Years')
	expect(years.fields!.map((field) => field.name)).not.toContain('current')
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

const reviewedUrlPattern = [
	'^(?:https?://|mailto:|tel:|/(?!/)|#)',
	'Use an https URL, mailto:, tel:, site-relative URL, or fragment.'
]

const urlDestinations = {
	valid: ['https://example.ca/page', '/about', 'mailto:grc@example.ca', 'tel:+14161234567', '#contact'],
	invalid: ['javascript:alert(1)', '//example.ca/about', 'ftp://example.ca/file']
}

// The publishing schema gates on `z.email()`, so the CMS pattern must accept exactly the same corpus.
const emailAddresses = {
	valid: ['grc.facmed@utoronto.ca', 'a@b.co', 'first.last+tag@sub.example.com', "o'brien@example.com"],
	invalid: [
		'a@b.c',
		'a..b@example.com',
		'.a@example.com',
		'a@b..c',
		'a@b_c.com',
		'ü@example.com',
		'a@-b.com',
		'a@example.com.',
		'..a@example.com',
		'a.@example.com',
		'a@.example.com',
		'grc.facmed',
		'grc@utoronto',
		'grc@utoronto.',
		'not an email',
		'@utoronto.ca'
	]
}

const executePattern = (field: Field, label: string) => {
	expect(field.pattern, `${label} pattern`).toHaveLength(2)
	const [source, message] = field.pattern as [string, string]
	expect(message, `${label} pattern message`).toBeTruthy()
	expect(source, `${label} pattern source`).toBeTruthy()
	return new RegExp(source)
}

test('URL and email fields share actionable, consistent validation contracts', () => {
	const { config } = readConfig()
	const advanced = getCollection(config, 'advanced_site_settings')
	const navigationFile = advanced.files?.find(({ name }) => name === 'navigation')
	const siteFile = advanced.files?.find(({ name }) => name === 'site')
	expect(navigationFile, 'Missing navigation configuration').toBeDefined()
	expect(siteFile, 'Missing site configuration').toBeDefined()

	const socialUrl = getField(getField(siteFile!.fields, 'socialLinks').fields!, 'url')
	const navigationUrl = getField(getField(navigationFile!.fields, 'links').fields!, 'url')
	const featureLinks = getField(
		getField(getCollection(config, 'homepage').files![0].fields, 'featureSections').fields!,
		'links'
	)
	const featureUrl = getField(featureLinks.fields!, 'url')

	for (const [label, field] of [
		['social links', socialUrl],
		['navigation', navigationUrl],
		['homepage feature links', featureUrl]
	] as const) {
		expect(field.pattern, `${label} URL pattern`).toEqual(reviewedUrlPattern)
		const pattern = executePattern(field, label)
		for (const url of urlDestinations.valid) expect(pattern.test(url), `${label} accepts ${url}`).toBeTruthy()
		for (const url of urlDestinations.invalid) expect(pattern.test(url), `${label} rejects ${url}`).toBeFalsy()
		expect(field.hint, `${label} URL hint`).toMatch(/https:\/\//)
		expect(field.hint, `${label} URL hint`).toMatch(/#fragment/)
	}

	const email = getField(getField(siteFile!.fields, 'contact').fields!, 'email')
	const emailPattern = executePattern(email, 'contact email')
	expect((email.pattern as string[])[1]).toBe('Use an email address like grc.facmed@utoronto.ca.')
	for (const address of emailAddresses.valid) {
		expect(emailPattern.test(address), `CMS email pattern accepts ${address}`).toBeTruthy()
		expect(z.email().safeParse(address).success, `publishing schema accepts ${address}`).toBeTruthy()
	}
	for (const address of emailAddresses.invalid) {
		expect(emailPattern.test(address), `CMS email pattern rejects ${address}`).toBeFalsy()
		expect(z.email().safeParse(address).success, `publishing schema rejects ${address}`).toBeFalsy()
	}
	expect(email.hint, 'contact email hint').toMatch(/grc\.facmed@utoronto\.ca/)
})

test('Advanced Site Settings is marked as a site-wide area', () => {
	const { config } = readConfig()
	const advanced = getCollection(config, 'advanced_site_settings')

	expect(advanced.label).toBe('Advanced Site Settings')
	expect(advanced.description).toMatch(/every page/i)
})

test('resource navigation selects each fixed resource record exactly once in menu order', () => {
	const { config } = readConfig()
	const navigation = getCollection(config, 'advanced_site_settings').files?.find(({ name }) => name === 'navigation')
	expect(navigation, 'Missing navigation configuration').toBeDefined()
	const resourceLinks = getField(navigation!.fields, 'resourceLinks')

	expect(resourceLinks).toMatchObject({ widget: 'list', min: 8, max: 8 })
	expect(resourceLinks.hint, 'resource menu hint').toMatch(/drag/i)
	expect(resourceLinks.hint, 'resource menu hint').toMatch(/order/i)

	const slug = getField(resourceLinks.fields!, 'slug')
	expect(slug).toMatchObject({ widget: 'select' })
	const slugs = (slug.options ?? []).map((option) => (option as { value: string }).value)
	expect(slugs).toEqual(blogTagSchema.options)
	expect(new Set(slugs).size).toBe(blogTagSchema.options.length)
})

test('blog lifecycle fields use calendar dates and hide automated metadata', () => {
	const { config } = readConfig()
	const fields = getCollection(config, 'blog').fields!

	expect(getField(fields, 'pubDate')).toMatchObject({
		widget: 'datetime',
		type: 'date',
		format: 'YYYY-MM-DD',
		default: '{{now}}'
	})
	expect(getField(fields, 'updatedDate')).toMatchObject({ widget: 'hidden' })
	expect(getField(fields, 'status')).toMatchObject({
		widget: 'select',
		options: [
			{ label: 'Current', value: 'current' },
			{ label: 'Archived', value: 'archived' }
		],
		default: 'current'
	})
	expect(fields.map((field) => field.name)).not.toContain('reviewBy')
	expect(fields.map((field) => field.name)).not.toContain('contentOwner')
})

test('blog authoring exposes only the reviewed rich-text controls and semantic components', () => {
	const { config } = readConfig()
	const body = getField(getCollection(config, 'blog').fields!, 'body')

	expect(body).toMatchObject({
		widget: 'richtext',
		modes: ['rich_text'],
		buttons: [
			'heading-two',
			'heading-three',
			'heading-four',
			'bold',
			'italic',
			'link',
			'bulleted-list',
			'numbered-list'
		],
		editor_components: ['accessible-image', 'callout', 'action-link'],
		allow_nested_components: false,
		sanitize_preview: true,
		use_markdown_shortcuts: false
	})
	expect(readFileSync(new URL('../public/admin/customizations.js', import.meta.url), 'utf8')).toContain(
		'editor_components: []'
	)
})

test('semantic component source round-trips quoted, ampersand, bracket, and escaped image-description values', () => {
	type Component = {
		id: string
		mode?: string
		summary?: string
		pattern: RegExp
		toBlock: (value: Record<string, string>) => string
		fromBlock: (match: RegExpMatchArray) => Record<string, string>
	}
	const components = new Map<string, Component>()
	runInNewContext(readFileSync(new URL('../public/admin/customizations.js', import.meta.url), 'utf8'), {
		Date,
		Intl,
		window: {
			CMS: {
				registerEditorComponent: (component: Component) => components.set(component.id, component),
				registerEventListener: () => undefined
			}
		}
	})

	const expectRoundTrip = (id: string, value: Record<string, string>) => {
		const component = components.get(id)!
		const source = component.toBlock(value)
		expect(component.fromBlock(source.match(component.pattern)!)).toEqual(value)
		expect([...`${source}\n\n${source}`.matchAll(new RegExp(component.pattern.source, 'g'))]).toHaveLength(2)
	}
	expect(components.get('action-link')).toMatchObject({ mode: 'dialog', summary: '{{label}}' })

	expectRoundTrip('callout', {
		kind: 'warning',
		title: 'Read "this" & keep [notes]',
		body: 'Body with **formatting**.'
	})
	expectRoundTrip('action-link', {
		url: 'https://example.com/?course=GRC&year=2026',
		label: 'Read "this" & keep [notes]',
		body: 'More details.'
	})
	expectRoundTrip('accessible-image', {
		src: '/assets/picture.webp',
		body: 'Diagram [A] & "path"'
	})
})

test('CMS generates a unique section anchor from the first heading and leaves existing anchors unchanged', () => {
	type Listener = { name: string; handler: (event: { entry: EntryStub }) => EntryStub }
	const listeners: Listener[] = []

	class EntryStub {
		constructor(private readonly value: Record<string, unknown>) {}
		get(key: string) {
			return this.value[key]
		}
		getIn(path: string[]) {
			return path.reduce<unknown>((current, key) => (current as Record<string, unknown> | undefined)?.[key], this.value)
		}
		setIn(path: string[], next: unknown) {
			const clone = structuredClone(this.value)
			let cursor = clone as Record<string, unknown>
			for (const key of path.slice(0, -1)) cursor = cursor[key] as Record<string, unknown>
			cursor[path.at(-1)!] = next
			return new EntryStub(clone)
		}
	}

	runInNewContext(readFileSync(new URL('../public/admin/customizations.js', import.meta.url), 'utf8'), {
		Date,
		Intl,
		window: {
			CMS: {
				registerEditorComponent: () => undefined,
				registerEventListener: (listener: Listener) => listeners.push(listener)
			}
		}
	})

	const saved = listeners
		.find((listener) => listener.name === 'preSave')!
		.handler({
			entry: new EntryStub({
				collection: 'resources',
				data: {
					sections: [{ id: 'cupe', title: 'Changed heading' }, { title: 'Seasonal Job Fairs' }, { title: 'Resources' }]
				}
			})
		})

	expect(saved.getIn(['data', 'sections'])).toEqual([
		{ id: 'cupe', title: 'Changed heading' },
		{ id: generateSectionAnchor('Seasonal Job Fairs', ['cupe']), title: 'Seasonal Job Fairs' },
		{
			id: generateSectionAnchor('Resources', ['cupe', generateSectionAnchor('Seasonal Job Fairs', ['cupe'])]),
			title: 'Resources'
		}
	])
})

test('Sveltia task areas retain current file paths and data field trees', () => {
	const { source, config } = readConfig()

	expect(source).toContain('fields: &typed_resource_fields')
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
	expect(resources).toMatchObject({ format: 'json' })
	expect(resources.files?.map((file) => file.name)).toEqual([
		'employment',
		'career-planning-exploration',
		'continuing-education',
		'health-wellness',
		'housing',
		'other',
		'scholarships-bursaries-awards',
		'scholarship-award-grant-application-support'
	])
	expect(getField(blog.fields!, 'tags').options).toEqual(resourceCategories)
	for (const file of resources.files!) {
		const data = JSON.parse(readFileSync(join(root.pathname, file.file!), 'utf8'))
		expect(data.slug).toBe(file.name)
		expect(file.file).toBe(`src/data/resources/${file.name}.json`)
		expect(file.preview_path).toBe('/resources/{{slug}}/')
		expect(fieldShape(file.fields)).toEqual(cmsFieldContract.typedResources)
		expectDataFields(data, file.fields)
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

test('Employment CMS uses typed card blocks and hides section anchors from routine controls', () => {
	const { config } = readConfig()
	const sections = getField(getResourceFile(config, 'employment').fields, 'sections')
	expect(sections.collapsed).toBe('auto')
	expect(getField(sections.fields!, 'id')).toMatchObject({ widget: 'hidden' })
	expect(getField(sections.fields!, 'status')).toMatchObject({
		widget: 'select',
		options: [
			{ label: 'Current', value: 'current' },
			{ label: 'Archived', value: 'archived' }
		],
		hint: 'Archived sections leave quick navigation and search. They keep their heading, a required notice, and an optional replacement link.'
	})
	const cards = getField(sections.fields!, 'cards')
	expect(cards.fields!.map((field) => field.name)).toEqual(['title', 'variant', 'status', 'blocks'])
	expect(getField(cards.fields!, 'blocks').types?.map((type) => type.name)).toEqual([
		'text',
		'image',
		'links',
		'steps',
		'contact',
		'contact-panels',
		'callout'
	])
	expect(
		getField(getField(cards.fields!, 'blocks').types!.find((type) => type.name === 'text')!.fields!, 'body')
	).toMatchObject({
		widget: 'richtext',
		buttons: ['bold', 'italic', 'link', 'bulleted-list']
	})
	expect(
		getField(getField(cards.fields!, 'blocks').types!.find((type) => type.name === 'callout')!.fields!, 'body')
	).toMatchObject({
		widget: 'richtext',
		buttons: ['bold', 'italic', 'link', 'bulleted-list', 'numbered-list']
	})

	const housingCards = getField(getField(getResourceFile(config, 'housing').fields, 'sections').fields!, 'cards')
	expect(housingCards.fields!.map((field) => field.name)).toEqual(['title', 'variant', 'status', 'blocks'])
	expect(getField(housingCards.fields!, 'blocks').types?.map((type) => type.name)).toEqual([
		'text',
		'image',
		'links',
		'steps',
		'contact',
		'contact-panels',
		'callout'
	])
})

test('admin loads only the pinned Sveltia editor asset', () => {
	const index = readFileSync(new URL('../public/admin/index.html', import.meta.url), 'utf8')
	const config = readFileSync(configPath, 'utf8')
	const cmsScript = `https://unpkg.com/@sveltia/cms@${sveltiaVersion}/dist/sveltia-cms.js`

	expect(index).toContain(cmsScript)
	expect(index.indexOf('/admin/customizations.js')).toBeGreaterThan(index.indexOf(cmsScript))
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
