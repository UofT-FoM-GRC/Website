type FieldShape = string | { [name: string]: FieldShape }

export const cmsFieldContract: Record<string, FieldShape> = {
	blog: {
		title: 'string',
		description: 'text',
		pubDate: 'datetime',
		updatedDate: 'datetime',
		status: 'select',
		reviewBy: 'datetime',
		expiresOn: 'datetime',
		contentOwner: 'string',
		heroImage: 'image',
		heroImageAlt: 'string',
		tags: 'select',
		body: 'markdown'
	},
	resources: {
		slug: 'hidden',
		title: 'string',
		description: 'text',
		cardTitle: 'string',
		cardImage: 'image',
		cardImageAlt: 'string',
		sections: {
			id: 'string',
			title: 'string',
			intro: { paragraph: 'text' },
			columns: 'select',
			cards: {
				title: 'string',
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
