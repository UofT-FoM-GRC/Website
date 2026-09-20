import { expect, test } from '@playwright/test'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import remarkDirective from 'remark-directive'
import { semanticBlockRemarkPlugin } from '../src/utils/semanticBlocks'

const renderSemanticBlogMarkdown = (source: string) =>
	String(
		unified()
			.use(remarkParse)
			.use(remarkDirective)
			.use(semanticBlockRemarkPlugin)
			.use(remarkRehype as never)
			.use(rehypeStringify)
			.processSync(source)
	)

test('renders an information callout with its visible label, optional heading, and Markdown body', () => {
	const output = renderSemanticBlogMarkdown(`:::callout{kind="information" title="Before you begin"}
Read the **instructions**.
:::`)

	expect(output).toContain('<aside class="semantic-callout" data-callout-kind="information">')
	expect(output).toContain('Information')
	expect(output).toContain('Before you begin')
	expect(output).toContain('<strong>instructions</strong>')
	expect(output).not.toContain('<h2')
})

test('renders every callout kind, action-link supporting text, and accessible image syntax', () => {
	for (const [kind, label] of [
		['information', 'Information'],
		['important', 'Important'],
		['warning', 'Warning']
	]) {
		const output = renderSemanticBlogMarkdown(`:::callout{kind="${kind}"}
${label} body.
:::`)
		expect(output).toContain(`data-callout-kind="${kind}"`)
		expect(output).toContain(`<strong>${label}</strong>`)
		expect(output).toMatch(/semantic-callout__icon[^>]*aria-hidden="true"/)
	}

	const output = renderSemanticBlogMarkdown(`:::action-link{url="mailto:grc@example.com" label="Contact the GRC"}
Questions are welcome.
:::

:accessible-image{src="/assets/students.webp" description="Students discussing a project"}`)
	expect(output).toContain('<div class="semantic-action-link">')
	expect(output).toMatch(/<a href="mailto:grc@example\.com" class="semantic-action-link__link">Contact the GRC<\/a>/)
	expect(output).toContain('Questions are welcome.')
	expect(output).toContain('<img src="/assets/students.webp" alt="Students discussing a project">')
})

test('rejects malformed, unknown, nested, unsafe, and incomplete semantic source', () => {
	for (const [source, message] of [
		[':::callout{kind="notice"}\nBody\n:::', 'Callout kind must be information, important, or warning.'],
		[':::callout{kind="information"}\n\n:::', 'Callout body is required.'],
		[':::callout{kind="information" colour="blue"}\nBody\n:::', 'Unsupported callout attribute "colour".'],
		[':::action-link{url="javascript:alert(1)" label="Open"}\n:::', 'Action link URL must use'],
		[':::action-link{url="//example.com" label="Open"}\n:::', 'Action link URL must use'],
		[':::unknown\nBody\n:::', 'Unsupported semantic directive "unknown".'],
		[
			':::callout{kind="information"}\n:::callout{kind="warning"}\nNested\n:::\n:::',
			'Nested semantic directives are not allowed.'
		],
		[':::callout{kind="information"', 'Malformed semantic directive.'],
		[
			':::action-link{url="https://example.com" label="<img src=x onerror=alert(1)>"}\n:::',
			'Action link label cannot contain markup characters.'
		],
		['![](/assets/empty-description.webp)', 'Image description is required for every Markdown image.'],
		[':accessible-image{src="/assets/image.webp"}', 'Image description is required and cannot be empty.'],
		[
			':accessible-image{src="https://example.com/image.webp" description="Image"}',
			'Image source must be a site asset path.'
		],
		[
			':accessible-image{src="/assets/image.webp" description="Image" extra="value"}',
			'Unsupported accessible-image attribute "extra"'
		],
		[
			'::accessible-image{src="/assets/image.webp" description="Image"}\n:::',
			'Accessible image must use text directive syntax.'
		]
	]) {
		expect(() => renderSemanticBlogMarkdown(source)).toThrow(message)
	}
})

test('escapes directive attributes through AST properties instead of injecting HTML', () => {
	const output =
		renderSemanticBlogMarkdown(`:::action-link{url="https://example.com/?course=GRC&year=2026" label="Open details"}
:::`)

	expect(output).toContain('href="https://example.com/?course=GRC&#x26;year=2026"')
	expect(output).not.toContain('<script')
})

test('rejects prototype enum values, normalized external paths, empty fragments, and raw directive HTML', () => {
	for (const [source, message] of [
		[
			`:::action-link{url="/\\example.com" label="Open"}
:::`,
			'Action link URL must use'
		],
		[
			`:::action-link{url="#" label="Open"}
:::`,
			'Action link URL must include a fragment'
		],
		[
			`:::callout{kind="toString"}
Body
:::`,
			'Callout kind must be information, important, or warning.'
		],
		[
			`:::callout{kind="information"}
<script>alert(1)</script>
:::`,
			'Raw HTML is not allowed inside semantic directives.'
		]
	]) {
		expect(() => renderSemanticBlogMarkdown(source)).toThrow(message)
	}
})
