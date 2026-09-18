import { expect, test } from '@playwright/test'
import { readdirSync, readFileSync } from 'node:fs'
import rehypeStringify from 'rehype-stringify'
import remarkDirective from 'remark-directive'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { semanticBlockRemarkPlugin } from '../src/utils/semanticBlocks'
import { blogMigration } from './fixtures/blog-migration'

const blogDirectory = new URL('../src/blog/', import.meta.url)
const normalize = (value: string) =>
	value
		.replace(/\\([:])/g, '$1')
		.replace(/&colon;/g, ':')
		.replace(/[*_]/g, '')
		.replace(/(?:^|\s)-\s/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
const body = (source: string) => source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')

type MarkdownNode = {
	type: string
	name?: string
	attributes?: Record<string, string>
	url?: string
	value?: string
	children?: MarkdownNode[]
}

const markdownTree = (source: string) =>
	unified().use(remarkParse).use(remarkDirective).parse(source) as unknown as MarkdownNode

const markdownNodes = (node: MarkdownNode, nodes: MarkdownNode[] = []): MarkdownNode[] => {
	nodes.push(node)
	for (const child of node.children ?? []) markdownNodes(child, nodes)
	return nodes
}

const markdownText = (node: MarkdownNode): string =>
	`${node.value ?? ''}${(node.children ?? []).map(markdownText).join('')}`

const semanticDirectives = (source: string, name: string) =>
	markdownNodes(markdownTree(source))
		.filter((node) => node.type === 'containerDirective' || node.type === 'textDirective')
		.filter((node) => node.name === name)

const directText = (node: MarkdownNode) =>
	markdownText({ ...node, children: (node.children ?? []).filter((child) => child.type !== 'list') })

const migratedTables = [
	{
		marker: 'Program:',
		headers: ['Program', 'Living Allowance', 'Tuition & Fees', 'UHIP', 'Total Base Funding'],
		rows: [
			['Domestic MSc (2024-25)', '$29,819.88', '$9,438.48', '—', '$39,258.36'],
			['Domestic MSc (2025-26)', '$29,819.88', '$9,608.48', '—', '$39,428.36'],
			['Domestic PhD', '$32,910.48', '$8,448.48', '—', '$41,358.96'],
			['International MSc', '$29,819.88', '$34,108.48', '$756.00', '$64,684.36'],
			['International PhD', '$32,910.48', '$8,448.48', '$756.00', '$42,114.96']
		]
	},
	{
		marker: 'Your Total Scholarship Amount:',
		headers: ['Your Total Scholarship Amount', 'What Happens', 'Top-Up Amount'],
		rows: [
			['$0 to $2,000', "You keep the full amount. It doesn't reduce your base funding.", 'No top-up'],
			['$2,001 to $9,999', 'Goes toward base funding', '$2,000 top-up'],
			['$10,000 to $15,000', 'Goes toward base funding', '$3,000 top-up'],
			['$15,001 to $39,999', 'Goes toward base funding', '$4,000 top-up'],
			['$40,000 to $45,000', 'Goes toward base funding', '$5,000 top-up ⭐ New!'],
			['$45,001 to $50,000', 'You keep up to $50,000 total', 'No top-up'],
			['Over $50,000', 'You can only keep $50,000', 'No top-up']
		]
	}
]

test('migration manifest covers every blog exactly once', () => {
	const files = readdirSync(blogDirectory)
		.filter((file) => file.endsWith('.md'))
		.sort()
	expect(blogMigration.map(({ file }) => file).sort()).toEqual(files)
})

test('migration scanner handles frontmatter, HTML autolinks, and encoded directive attributes structurally', () => {
	const article = body(
		`---\r\ntitle: 'Fixture'\r\n---\r\n<https://example.com>\r\n\r\n:accessible-image{src="/assets/image.webp" description="A &quot;quoted&quot; &amp; linked image"}`
	)
	const nodes = markdownNodes(markdownTree(article))

	expect(article).toContain('<https://example.com>')
	expect(nodes.filter((node) => node.type === 'html')).toEqual([])
	expect(nodes.find((node) => node.type === 'link')?.url).toBe('https://example.com')
	expect(semanticDirectives(article, 'accessible-image')[0].attributes).toEqual({
		src: '/assets/image.webp',
		description: 'A "quoted" & linked image'
	})
})

test('every blog uses only portable semantic source and preserves the migration manifest', () => {
	for (const migration of blogMigration) {
		const source = readFileSync(new URL(migration.file, blogDirectory), 'utf8')
		const article = body(source)
		const nodes = markdownNodes(markdownTree(article))
		expect(
			nodes.filter((node) => node.type === 'html'),
			`${migration.file} must not retain routine HTML`
		).toEqual([])
		expect(article, `${migration.file} must not retain thematic separators`).not.toMatch(/^---\s*$/m)
		expect(article, `${migration.file} must not retain Markdown tables`).not.toMatch(/^\|.*\|\s*$/m)

		const directiveLines = article.split(/\r?\n/).filter((line) => line.trimStart().startsWith(':::'))
		for (const line of directiveLines) {
			expect(line, `${migration.file} directives must be top-level`).toBe(line.trimStart())
			expect(line, `${migration.file} must use approved directive syntax`).toMatch(
				/^:::$|^:::(?:callout|action-link)\{.*}\s*$/
			)
		}

		const directives = nodes.filter((node) =>
			['containerDirective', 'leafDirective', 'textDirective'].includes(node.type)
		)
		expect(
			directives.map((node) => `${node.type}:${node.name}`).sort(),
			`${migration.file} must use approved directives only`
		).toEqual(
			[
				...migration.callouts.map(() => 'containerDirective:callout'),
				...(migration.actionLinks ?? []).map(() => 'containerDirective:action-link'),
				...(migration.images ?? []).map(() => 'textDirective:accessible-image')
			].sort()
		)
		expect(article, `${migration.file} must not retain Markdown image syntax`).not.toMatch(/!\[[^\]]*]\([^)]*\)/)

		const callouts = semanticDirectives(article, 'callout')
		expect(callouts, `${migration.file} callout count`).toHaveLength(migration.callouts.length)
		for (const [index, expected] of migration.callouts.entries()) {
			const callout = callouts[index]
			expect(callout.attributes?.kind).toBe(expected.kind)
			if (expected.title) expect(callout.attributes?.title).toBe(expected.title)
			else expect(callout.attributes).not.toHaveProperty('title')
			for (const fact of expected.facts) expect(normalize(markdownText(callout))).toContain(normalize(fact))
		}

		const images = semanticDirectives(article, 'accessible-image').map((node) => ({
			src: node.attributes?.src,
			description: node.attributes?.description
		}))
		expect(images).toEqual(migration.images ?? [])
		const actionLinks = semanticDirectives(article, 'action-link').map((node) => ({
			url: node.attributes?.url,
			label: node.attributes?.label
		}))
		expect(actionLinks).toEqual(migration.actionLinks ?? [])
		for (const fact of migration.legacyFacts ?? []) expect(normalize(article)).toContain(normalize(fact))
	}
})

test('every blog parses through the production semantic remark pipeline', () => {
	for (const file of readdirSync(blogDirectory).filter((name) => name.endsWith('.md'))) {
		const source = readFileSync(new URL(file, blogDirectory), 'utf8')
		expect(
			() =>
				unified()
					.use(remarkParse)
					.use(remarkDirective)
					.use(semanticBlockRemarkPlugin)
					.use(remarkRehype as never)
					.use(rehypeStringify)
					.processSync(body(source)),
			file
		).not.toThrow()
	}
})

test('converted HBFA tables retain headers, cell values, and row grouping as nested lists', () => {
	const article = body(readFileSync(new URL('hbfa-2025-26-update.md', blogDirectory), 'utf8'))
	const lists = markdownNodes(markdownTree(article)).filter((node) => node.type === 'list')

	for (const expected of migratedTables) {
		for (const header of expected.headers) expect(article).toContain(header)
		const table = lists.find((list) => directText(list).includes(expected.marker))
		expect(table, `Missing table beginning ${expected.marker}`).toBeDefined()
		const rows = table!.children ?? []
		expect(rows).toHaveLength(expected.rows.length)
		for (const [rowIndex, cells] of expected.rows.entries()) {
			const row = rows[rowIndex]
			expect(directText(row)).toContain(cells[0])
			const cellList = (row.children ?? []).find((child) => child.type === 'list')
			expect(cellList, `Missing cells for ${cells[0]}`).toBeDefined()
			expect(cellList!.children?.map(directText)).toHaveLength(cells.length - 1)
			for (const [cellIndex, cell] of cells.slice(1).entries()) {
				expect(directText(cellList!.children![cellIndex])).toContain(cell)
			}
		}
	}
})
