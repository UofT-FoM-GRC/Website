type FieldShape = string | { [name: string]: FieldShape }

export const cmsFieldContract: Record<string, FieldShape> = {
	blog: {
		title: 'string',
		description: 'text',
		pubDate: 'datetime',
		updatedDate: 'hidden',
		status: 'select',
		expiresOn: 'datetime',
		heroImage: 'image',
		heroImageAlt: 'string',
		tags: 'select',
		body: 'richtext'
	},
	resources: {
		slug: 'hidden',
		title: 'string',
		description: 'text',
		cardTitle: 'string',
		cardImage: 'image',
		cardImageAlt: 'string',
		sections: {
			id: 'hidden',
			title: 'string',
			intro: { paragraph: 'text' },
			columns: 'select',
			status: 'select',
			archiveNotice: 'text',
			replacement: { label: 'string', url: 'string' },
			cards: {
				title: 'string',
				status: 'select',
				text: { paragraph: 'text' },
				bullets: { bullet: 'string' },
				variant: 'select',
				linkStyle: 'select',
				listStyle: 'select',
				listItems: {
					text: 'string',
					links: { label: 'string', url: 'string' },
					items: { item: 'string' }
				},
				addressLines: { line: 'string' },
				facts: { label: 'string', value: 'string', url: 'string' },
				groups: {
					title: 'string',
					text: { paragraph: 'text' },
					addressLines: { line: 'string' },
					facts: { label: 'string', value: 'string', url: 'string' },
					links: { label: 'string', url: 'string' }
				},
				image: 'image',
				imageAlt: 'string',
				links: { label: 'string', url: 'string' }
			}
		}
	},
	typedResources: {
		slug: 'hidden',
		title: 'string',
		description: 'text',
		cardTitle: 'string',
		cardImage: 'image',
		cardImageAlt: 'string',
		sections: {
			id: 'hidden',
			title: 'string',
			intro: { paragraph: 'text' },
			columns: 'select',
			status: 'select',
			archiveNotice: 'text',
			replacement: { label: 'string', url: 'string' },
			cards: {
				title: 'string',
				variant: 'select',
				status: 'select',
				blocks: {
					types: {
						text: { body: 'richtext' },
						image: { image: 'image', imageAlt: 'string' },
						links: { appearance: 'select', items: { label: 'string', url: 'string' } },
						steps: {
							listStyle: 'select',
							items: {
								text: 'string',
								links: { label: 'string', url: 'string' },
								items: { item: 'string' }
							}
						},
						contact: {
							addressLines: { line: 'string' },
							facts: { label: 'string', value: 'string', url: 'string' }
						},
						'contact-panels': {
							panels: {
								title: 'string',
								text: { paragraph: 'text' },
								addressLines: { line: 'string' },
								facts: { label: 'string', value: 'string', url: 'string' },
								links: { label: 'string', url: 'string' }
							}
						},
						callout: { kind: 'select', title: 'string', body: 'richtext' }
					}
				}
			}
		}
	},
	announcements: { items: { title: 'string', text: 'text', url: 'string', active: 'boolean' } },
	homepage: {
		hero: { image: 'image', imageAlt: 'string', lines: { line: 'string' } },
		featureSections: {
			title: 'string',
			paragraphs: { paragraph: 'text' },
			links: { label: 'string', url: 'string' },
			image: 'image',
			imageAlt: 'string',
			tone: 'select',
			imageFirst: 'boolean'
		},
		contactHeading: 'string',
		contactText: 'text'
	},
	team: {
		about: {
			title: 'string',
			description: 'text',
			heroImage: 'image',
			heroImageAlt: 'string',
			purposeTitle: 'string',
			purposeParagraphs: { paragraph: 'text' },
			objectives: { objective: 'string' },
			workTitle: 'string',
			workParagraphs: { paragraph: 'text' }
		},
		years: {
			year: 'string',
			current: 'boolean',
			members: { name: 'string', position: 'string', image: 'image', imageAlt: 'string' }
		}
	},
	navigation: {
		brand: 'string',
		links: { label: 'string', url: 'string' },
		resourceLabel: 'string',
		resourceLinks: { label: 'string', slug: 'select' }
	},
	site: {
		title: 'string',
		description: 'text',
		contact: { email: 'string' },
		socialLinks: { label: 'string', url: 'string', network: 'select' }
	}
}
