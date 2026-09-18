;(() => {
	const escapeDirectiveAttribute = (value) => String(value).trim().replace(/&/g, '&amp;').replace(/"/g, '&quot;')
	const unescapeDirectiveAttribute = (value = '') => value.replace(/&quot;/g, '"').replace(/&amp;/g, '&')
	const unescapeImageDescription = (value = '') => value.replace(/\\([\\[\]])/g, '$1')
	const componentBodyField = (label, required = false) => ({
		name: 'body',
		label,
		widget: 'richtext',
		required,
		modes: ['rich_text'],
		buttons: ['bold', 'italic', 'link', 'bulleted-list', 'numbered-list'],
		editor_components: [],
		allow_nested_components: false,
		sanitize_preview: true,
		use_markdown_shortcuts: false
	})

	const calloutToBlock = ({ kind, title, body }) => {
		const titleAttribute = title?.trim() ? ` title="${escapeDirectiveAttribute(title)}"` : ''
		return `:::callout{kind="${escapeDirectiveAttribute(kind)}"${titleAttribute}}\n${String(body ?? '').trim()}\n:::`
	}
	const actionLinkToBlock = ({ url, label, body }) =>
		`:::action-link{url="${escapeDirectiveAttribute(url)}" label="${escapeDirectiveAttribute(label)}"}\n${String(body ?? '').trim()}\n:::`
	const accessibleImageToBlock = ({ src, body }) =>
		`:accessible-image{src="${escapeDirectiveAttribute(src)}" description="${escapeDirectiveAttribute(body)}"}`

	window.CMS.registerEditorComponent({
		id: 'accessible-image',
		label: 'Accessible image',
		fields: [
			{
				name: 'src',
				label: 'Image',
				widget: 'image',
				required: true,
				accept: 'image/jpeg,image/png,image/webp',
				media_folder: 'public/assets',
				public_folder: '/assets'
			},
			{ name: 'body', label: 'Image Description', widget: 'string', required: true }
		],
		pattern: /:accessible-image\{src="((?:&quot;|&amp;|[^"])*)" description="((?:&quot;|&amp;|[^"])*)"\}/s,
		fromBlock: (match) => ({
			body: unescapeImageDescription(unescapeDirectiveAttribute(match[2])),
			src: unescapeDirectiveAttribute(match[1])
		}),
		toBlock: accessibleImageToBlock,
		toPreview: accessibleImageToBlock
	})

	window.CMS.registerEditorComponent({
		id: 'callout',
		label: 'Callout',
		fields: [
			{
				name: 'kind',
				label: 'Callout Kind',
				widget: 'select',
				options: [
					{ label: 'Information', value: 'information' },
					{ label: 'Important', value: 'important' },
					{ label: 'Warning', value: 'warning' }
				],
				default: 'information'
			},
			{ name: 'title', label: 'Optional Heading', widget: 'string', required: false },
			componentBodyField('Callout Message', true)
		],
		pattern: /:::callout\{kind="((?:&quot;|&amp;|[^"])*)"(?: title="((?:&quot;|&amp;|[^"])*)")?\}\n([\s\S]*?)\n:::/,
		fromBlock: (match) => ({
			kind: unescapeDirectiveAttribute(match[1]),
			title: unescapeDirectiveAttribute(match[2]),
			body: match[3]
		}),
		toBlock: calloutToBlock,
		toPreview: calloutToBlock
	})

	window.CMS.registerEditorComponent({
		id: 'action-link',
		label: 'Action link',
		fields: [
			{ name: 'label', label: 'Link Text', widget: 'string', required: true },
			{
				name: 'url',
				label: 'Destination URL',
				widget: 'string',
				required: true,
				pattern: [
					'^(?:https?://|mailto:|tel:|/(?![\\\\/])|#\\S+)',
					'Use an https URL, mailto:, tel:, site-relative URL, or fragment.'
				]
			},
			componentBodyField('Optional Supporting Text')
		],
		pattern: /:::action-link\{url="((?:&quot;|&amp;|[^"])*)" label="((?:&quot;|&amp;|[^"])*)"\}\n([\s\S]*?)\n:::/,
		fromBlock: (match) => ({
			url: unescapeDirectiveAttribute(match[1]),
			label: unescapeDirectiveAttribute(match[2]),
			body: match[3]
		}),
		toBlock: actionLinkToBlock,
		toPreview: actionLinkToBlock
	})

	const torontoDate = (now = new Date()) => {
		const parts = new Intl.DateTimeFormat('en-CA', {
			timeZone: 'America/Toronto',
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		}).formatToParts(now)
		const value = (type) => parts.find((part) => part.type === type)?.value
		return `${value('year')}-${value('month')}-${value('day')}`
	}

	const slugify = (text) =>
		String(text ?? '')
			.toLowerCase()
			.trim()
			.replace(/\s+/g, '-')
			.replace(/&/g, '-and-')
			.replace(/[^\w-]+/g, '')
			.replace(/--+/g, '-')
			.replace(/^-+/, '')
			.replace(/-+$/, '')

	const generateSectionAnchor = (title, existing) => {
		const used = new Set(existing)
		const base = slugify(title) || 'section'
		if (!used.has(base)) return base
		let suffix = 2
		while (used.has(`${base}-${suffix}`)) suffix += 1
		return `${base}-${suffix}`
	}

	const assignSectionAnchors = (entry) => {
		const sections = entry.getIn(['data', 'sections'])
		if (!sections) return entry
		const list = typeof sections.toJS === 'function' ? sections.toJS() : sections
		if (!Array.isArray(list)) return entry
		const used = list.map((section) => section?.id).filter(Boolean)
		const updated = list.map((section) => {
			if (!section || typeof section !== 'object' || section.id) return section
			const id = generateSectionAnchor(section.title, used)
			used.push(id)
			return { ...section, id }
		})
		return entry.setIn(['data', 'sections'], updated)
	}

	window.CMS.registerEventListener({
		name: 'preSave',
		handler: ({ entry }) => {
			try {
				if (entry.get('collection') === 'blog' && !entry.get('newRecord')) {
					entry = entry.setIn(['data', 'updatedDate'], torontoDate())
				}
				if (entry.get('collection') === 'resources') entry = assignSectionAnchors(entry)
			} catch (error) {
				console.error(error)
			}
			return entry
		}
	})
})()
