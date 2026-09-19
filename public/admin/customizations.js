;(() => {
	const escapeDirectiveAttribute = (value) => String(value).trim().replace(/&/g, '&amp;').replace(/"/g, '&quot;')
	const unescapeDirectiveAttribute = (value = '') => value.replace(/&quot;/g, '"').replace(/&amp;/g, '&')
	const unescapeImageDescription = (value = '') => value.replace(/\\([\\[\]])/g, '$1')
	const actionLinkUrlMessage = 'Use an https URL, mailto:, tel:, site-relative URL, or fragment.'
	const getActionLinkUrlError = (value) => {
		const url = String(value ?? '').trim()
		if (!url || /[\s\u0000-\u001F\u007F<>]/.test(url)) return actionLinkUrlMessage
		if (url.startsWith('/')) return url.startsWith('//') || url.startsWith('/\\') ? actionLinkUrlMessage : null
		if (url.startsWith('#')) return url.length === 1 ? 'Enter text after # for a fragment link.' : null
		let parsed
		try {
			parsed = new URL(url)
		} catch {
			return actionLinkUrlMessage
		}
		if (!['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)) return actionLinkUrlMessage
		if (['http:', 'https:'].includes(parsed.protocol) && !parsed.hostname) return actionLinkUrlMessage
		if (['mailto:', 'tel:'].includes(parsed.protocol) && !parsed.pathname) return actionLinkUrlMessage
		return null
	}
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
				pattern: ['^(?:https?://|mailto:|tel:|/(?![\\\\/])|#\\S+)', actionLinkUrlMessage]
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

	// Keep this browser copy aligned with src/utils/strings.ts; cms-config.spec.ts compares both.

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

	const warnAboutInvalidBlogLinks = (entry) => {
		if (entry.get('collection') !== 'blog') return
		const body = String(entry.getIn(['data', 'body']) ?? '')
		for (const match of body.matchAll(/:::action-link\{url="((?:&quot;|&amp;|[^"])*)"/g)) {
			const message = getActionLinkUrlError(unescapeDirectiveAttribute(match[1]))
			if (message) {
				window.alert(
					`Validation issue in Body → Action link → Destination URL: ${message}\n\nThe draft can be saved, but validation and publishing remain blocked until this is corrected.`
				)
				return
			}
		}
	}

	window.CMS.registerEventListener({
		name: 'preSave',
		handler: ({ entry }) => {
			warnAboutInvalidBlogLinks(entry)
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

	// Hard gate before Sveltia merges the draft pull request. A thrown error stops the
	// merge attempt, so cancelling leaves the pull request unpublished on its branch.
	const confirmationMessage = 'I reviewed the site preview.'
	window.CMS.registerEventListener({
		name: 'prePublish',
		handler: () => {
			if (!window.confirm(confirmationMessage)) {
				throw new Error('Publishing was cancelled because the site preview was not confirmed.')
			}
		}
	})

	window.CMS.registerEventListener({
		name: 'preUnpublish',
		handler: ({ entry }) => {
			if (entry.get('collection') === 'blog') {
				throw new Error('Published blog posts cannot be deleted. Set Visibility to Archived instead.')
			}
		}
	})
})()
