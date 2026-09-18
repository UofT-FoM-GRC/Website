import type { z } from 'astro/zod'
import type { Plugin } from 'unified'
import rehypeStringify from 'rehype-stringify'
import remarkDirective from 'remark-directive'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import { typedResourceCardSchema, type ResourceBlock, type resourceSchema } from '../schemas'
import { semanticBlockRemarkPlugin } from './semanticBlocks'
import { slugify } from './strings'

type ResourcePage = z.infer<typeof resourceSchema>
type ResourceSection = ResourcePage['sections'][number]
type ResourceCard = ResourceSection['cards'][number]
type TypedResourceCard = z.infer<typeof typedResourceCardSchema>

type MarkdownNode = {
	type: string
	ordered?: boolean
	url?: string
	value?: string
	children?: MarkdownNode[]
}

type Failable = { fail: (...args: any[]) => never }

const allowedMarkdownTypes = new Set([
	'root',
	'paragraph',
	'text',
	'emphasis',
	'strong',
	'link',
	'list',
	'listItem',
	'break'
])

const siteOrigin = new URL('https://uoftfomgrc.ca').origin

const requireAllowedUrl = (url: string, file: Failable, node: MarkdownNode) => {
	if (url.startsWith('/')) {
		try {
			if (new URL(url, siteOrigin).origin !== siteOrigin) throw new Error('External origin')
		} catch {
			file.fail('Formatted text links must use https, http, mailto, tel, a site-relative path, or a fragment.', node)
		}
		return
	}
	if (url.startsWith('#')) {
		if (url.length === 1) file.fail('Formatted text links must include a fragment after #.', node)
		return
	}
	let parsed: URL
	try {
		parsed = new URL(url)
	} catch {
		file.fail('Formatted text links must use https, http, mailto, tel, a site-relative path, or a fragment.', node)
	}
	if (!['http:', 'https:', 'mailto:', 'tel:'].includes(parsed!.protocol)) {
		file.fail('Formatted text links must use https, http, mailto, tel, a site-relative path, or a fragment.', node)
	}
}

const rejectUnsupportedResourceMarkdown: Plugin = () => (tree, file) => {
	visit(tree, (node) => {
		const markdown = node as unknown as MarkdownNode
		if (['containerDirective', 'leafDirective', 'textDirective'].includes(markdown.type)) {
			file.fail('Semantic directives are not allowed in formatted text.', node)
		}
		if (markdown.type === 'html') file.fail('Raw HTML is not allowed in formatted text.', node)
		if (markdown.type === 'heading') file.fail('Formatted text cannot include headings.', node)
		if (markdown.type === 'image' || markdown.type === 'imageReference') {
			file.fail('Images belong in an image block.', node)
		}
		if (markdown.type === 'list' && markdown.ordered) file.fail('Numbered lists belong in a steps block.', node)
		if (markdown.type === 'link') requireAllowedUrl(markdown.url ?? '', file, markdown)
		if (!allowedMarkdownTypes.has(markdown.type)) {
			file.fail('Formatted text can only include paragraphs, emphasis, links, and bullet lists.', node)
		}
	})
}

export const generateSectionAnchor = (title: string, existing: Iterable<string>) => {
	const used = new Set(existing)
	const base = slugify(title) || 'section'
	if (!used.has(base)) return base
	let suffix = 2
	while (used.has(`${base}-${suffix}`)) suffix += 1
	return `${base}-${suffix}`
}

export const isTypedResourceCard = (card: ResourceCard): card is TypedResourceCard => 'blocks' in card

export const isArchivedSection = (section: ResourceSection) => section.status === 'archived'

export const visibleResourceCards = (cards: ResourceCard[]) => cards.filter((card) => card.status !== 'archived')

export const renderResourceMarkdown = (source: string) =>
	String(
		unified()
			.use(remarkParse)
			.use(remarkDirective)
			.use(rejectUnsupportedResourceMarkdown)
			.use(remarkRehype as never)
			.use(rehypeStringify)
			.processSync(source)
	)

const escapeDirectiveAttribute = (value: string) => value.trim().replaceAll('&', '&amp;').replaceAll('"', '&quot;')

export const renderResourceCallout = (block: Extract<ResourceBlock, { type: 'callout' }>) => {
	const title = block.title?.trim()
	const titleAttribute = title ? ` title="${escapeDirectiveAttribute(title)}"` : ''
	return String(
		unified()
			.use(remarkParse)
			.use(remarkDirective)
			.use(semanticBlockRemarkPlugin)
			.use(remarkRehype as never)
			.use(rehypeStringify)
			.processSync(`:::callout{kind="${block.kind}"${titleAttribute}}\n${block.body.trim()}\n:::`)
	)
}

export type { ResourceCard, ResourceSection, TypedResourceCard }
