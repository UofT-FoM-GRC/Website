import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

type MarkdownNode = {
	type: string
	name?: string
	attributes?: Record<string, string | undefined>
	children?: MarkdownNode[]
	alt?: string
	url?: string
	value?: string
	depth?: number
	data?: { hName?: string; hProperties?: Record<string, unknown> }
	position?: { start?: { line?: number; offset?: number }; end?: { offset?: number } }
}

const calloutLabels = {
	information: 'Information',
	important: 'Important',
	warning: 'Warning'
} as const

type Failable = { fail: (...args: any[]) => never }

const containsControlCharacter = (value: string) => /[\u0000-\u001F\u007F]/.test(value)
const siteOrigin = new URL('https://uoftfomgrc.ca').origin

const getAttribute = (attributes: Record<string, string | undefined>, name: string) =>
	Object.hasOwn(attributes, name) ? attributes[name] : undefined

const requireText = (value: string | undefined, name: string, file: Failable, node: MarkdownNode): string => {
	if (!value || !value.trim()) file.fail(`${name} is required and cannot be empty.`, node)
	if (containsControlCharacter(value)) file.fail(`${name} cannot contain control characters.`, node)
	if (/[<>]/.test(value)) file.fail(`${name} cannot contain markup characters.`, node)
	return value
}

const requireOnlyAttributes = (
	attributes: Record<string, string | undefined>,
	allowed: string[],
	file: Failable,
	node: MarkdownNode
) => {
	for (const name of Object.keys(attributes)) {
		if (!allowed.includes(name)) file.fail(`Unsupported ${node.name} attribute "${name}".`, node)
	}
}

const requireAllowedUrl = (value: string | undefined, name: string, file: Failable, node: MarkdownNode): string => {
	const url = requireText(value, name, file, node)
	if (/\s/.test(url)) file.fail(`${name} cannot contain whitespace.`, node)

	if (url.startsWith('/')) {
		try {
			if (new URL(url, siteOrigin).origin !== siteOrigin) throw new Error('External origin')
		} catch {
			file.fail(`${name} must use https, http, mailto, tel, a site-relative path, or a fragment.`, node)
		}
		return url
	}

	if (url.startsWith('#')) {
		if (url.length === 1) file.fail(`${name} must include a fragment after #.`, node)
		return url
	}

	let parsed: URL
	try {
		parsed = new URL(url)
	} catch {
		file.fail(`${name} must use https, http, mailto, tel, a site-relative path, or a fragment.`, node)
	}

	if (!['http:', 'https:', 'mailto:', 'tel:'].includes(parsed!.protocol)) {
		file.fail(`${name} must use https, http, mailto, tel, a site-relative path, or a fragment.`, node)
	}
	if (['http:', 'https:'].includes(parsed!.protocol) && !parsed!.hostname) {
		file.fail(`${name} must include a host.`, node)
	}
	if (['mailto:', 'tel:'].includes(parsed!.protocol) && !parsed!.pathname) {
		file.fail(`${name} must include a destination after its scheme.`, node)
	}
	return url
}

const requireLocalImageSource = (value: string | undefined, file: Failable, node: MarkdownNode): string => {
	const source = requireText(value, 'Image source', file, node)
	if (/\s/.test(source) || !source.startsWith('/assets/')) {
		file.fail('Image source must be a site asset path.', node)
	}
	try {
		if (new URL(source, siteOrigin).origin !== siteOrigin) throw new Error('External origin')
	} catch {
		file.fail('Image source must be a site asset path.', node)
	}
	return source
}

const hasNestedSemanticDirective = (children: MarkdownNode[] = []): boolean => {
	return children.some(
		(node) =>
			['containerDirective', 'leafDirective', 'textDirective'].includes(node.type) ||
			hasNestedSemanticDirective(node.children)
	)
}

const hasRawHtml = (children: MarkdownNode[] = []): boolean =>
	children.some((node) => node.type === 'html' || hasRawHtml(node.children))

const decorate = (node: MarkdownNode, hName: string, hProperties: Record<string, unknown>) => {
	node.data = { hName, hProperties }
	return node
}

const paragraph = (children: MarkdownNode[], className: string) =>
	decorate({ type: 'paragraph', children }, 'p', { className: [className] })

const calloutLabel = (kind: keyof typeof calloutLabels) =>
	paragraph(
		[
			decorate(
				{
					type: 'emphasis',
					children: [{ type: 'text', value: kind === 'information' ? 'ℹ' : kind === 'important' ? '!' : '⚠' }]
				},
				'span',
				{ className: ['semantic-callout__icon'], ariaHidden: 'true' }
			),
			{ type: 'text', value: ' ' },
			{ type: 'strong', children: [{ type: 'text', value: calloutLabels[kind] }] }
		],
		'semantic-callout__label'
	)

const calloutTitle = (title: string) =>
	paragraph([{ type: 'strong', children: [{ type: 'text', value: title }] }], 'semantic-callout__title')

const actionLink = (label: string, url: string) =>
	paragraph(
		[
			decorate({ type: 'link', url, children: [{ type: 'text', value: label }] }, 'a', {
				className: ['semantic-action-link__link']
			})
		],
		'semantic-action-link__primary'
	)

/** Validates and maps portable blog directives to semantic HTML through AST metadata. */
export const semanticBlockRemarkPlugin: Plugin = () => (tree, file) => {
	const source = typeof file.value === 'string' ? file.value : ''

	visit(tree, (node) => {
		const directive = node as unknown as MarkdownNode
		if (directive.type === 'image' && !directive.alt?.trim()) {
			file.fail('Image description is required for every Markdown image.', node)
		}

		if (!['containerDirective', 'leafDirective', 'textDirective'].includes(directive.type)) return
		if (directive.name === 'accessible-image') {
			if (directive.type !== 'textDirective') file.fail('Accessible image must use text directive syntax.', node)
			const attributes = directive.attributes ?? {}
			requireOnlyAttributes(attributes, ['src', 'description'], file, directive)
			const src = requireLocalImageSource(getAttribute(attributes, 'src'), file, directive)
			const alt = requireText(getAttribute(attributes, 'description'), 'Image description', file, directive)
			decorate(directive, 'img', { src, alt })
			return
		}

		if (directive.type !== 'containerDirective' || !['callout', 'action-link'].includes(directive.name ?? '')) {
			file.fail(`Unsupported semantic directive "${directive.name ?? 'unnamed'}".`, node)
		}

		const rawDirective = source.slice(directive.position?.start?.offset, directive.position?.end?.offset).trimEnd()
		if (!rawDirective.endsWith(':::')) file.fail(`Malformed ${directive.name} directive: add a closing ::: line.`, node)
		if (hasNestedSemanticDirective(directive.children)) file.fail('Nested semantic directives are not allowed.', node)
		if (hasRawHtml(directive.children)) file.fail('Raw HTML is not allowed inside semantic directives.', node)

		const attributes = directive.attributes ?? {}
		if (directive.name === 'callout') {
			requireOnlyAttributes(attributes, ['kind', 'title'], file, directive)
			const kind = requireText(getAttribute(attributes, 'kind'), 'Callout kind', file, directive)
			if (!Object.hasOwn(calloutLabels, kind))
				file.fail('Callout kind must be information, important, or warning.', node)
			if (!directive.children?.length) file.fail('Callout body is required.', node)
			const title =
				getAttribute(attributes, 'title') === undefined
					? undefined
					: requireText(getAttribute(attributes, 'title'), 'Callout title', file, directive)
			directive.children = [
				calloutLabel(kind as keyof typeof calloutLabels),
				...(title ? [calloutTitle(title)] : []),
				...(directive.children ?? [])
			]
			decorate(directive, 'aside', { className: ['semantic-callout'], dataCalloutKind: kind })
			return
		}

		requireOnlyAttributes(attributes, ['url', 'label'], file, directive)
		const url = requireAllowedUrl(getAttribute(attributes, 'url'), 'Action link URL', file, directive)
		const label = requireText(getAttribute(attributes, 'label'), 'Action link label', file, directive)
		directive.children = [actionLink(label, url), ...(directive.children ?? [])]
		decorate(directive, 'div', { className: ['semantic-action-link'] })
	})

	visit(tree, 'text', (node) => {
		if ((node as unknown as MarkdownNode).value?.trimStart().startsWith(':::'))
			file.fail('Malformed semantic directive.', node)
	})
}
