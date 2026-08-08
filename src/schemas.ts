import { z } from 'astro/zod'

// Blog Tags
export const blogTagSchema = z.enum([
	'employment',
	'career-planning-exploration',
	'continuing-education',
	'health-wellness',
	'housing',
	'scholarships-bursaries-awards',
	'scholarship-award-grant-application-support',
	'other'
])
export type BlogTag = z.infer<typeof blogTagSchema>

// Blog Schema
export const blogSchema = z.object({
	title: z.string(),
	description: z.string(),
	pubDate: z.coerce.date(),
	updatedDate: z.coerce.date().optional(),
	heroImage: z.string().optional(),
	heroImageAlt: z.string().optional(),
	tags: z.array(blogTagSchema).min(1).max(3)
})
export type BlogPost = z.infer<typeof blogSchema>

const internalOrExternalUrlSchema = z
	.string()
	.regex(/^(?:https?:\/\/|mailto:|tel:|\/(?!\/)|#)/, 'Use an https URL, mailto:, tel:, site-relative URL, or fragment.')

const linkSchema = z.object({
	label: z.string(),
	url: internalOrExternalUrlSchema
})

const resourceListItemSchema = z.object({
	text: z.string(),
	links: z.array(linkSchema).default([]),
	items: z.array(z.string()).default([])
})

const resourceGroupSchema = z.object({
	title: z.string(),
	text: z.array(z.string()).default([]),
	links: z.array(linkSchema).default([]),
	addressLines: z.array(z.string()).default([]),
	facts: z
		.array(z.object({ label: z.string(), value: z.string(), url: internalOrExternalUrlSchema.optional() }))
		.default([])
})

const resourceCardSchema = z.object({
	title: z.string(),
	text: z.array(z.string()).default([]),
	links: z.array(linkSchema).default([]),
	bullets: z.array(z.string()).default([]),
	listStyle: z.enum(['unordered', 'ordered']).default('unordered'),
	listItems: z.array(resourceListItemSchema).default([]),
	groups: z.array(resourceGroupSchema).default([]),
	addressLines: z.array(z.string()).default([]),
	facts: z
		.array(z.object({ label: z.string(), value: z.string(), url: internalOrExternalUrlSchema.optional() }))
		.default([]),
	variant: z.enum(['card', 'plain']).default('card'),
	linkStyle: z.enum(['link', 'button']).default('link'),
	image: z.string().optional(),
	imageAlt: z.string().optional()
})

export const resourceSchema = z.object({
	slug: blogTagSchema,
	title: z.string(),
	cardTitle: z.string(),
	cardImage: z.string().min(1),
	cardImageAlt: z.string(),
	sections: z.array(
		z.object({
			id: z.string().regex(/^[a-z0-9-]+$/),
			title: z.string(),
			intro: z.array(z.string()).default([]),
			columns: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1),
			cards: z.array(resourceCardSchema).default([])
		})
	)
})

export const homepageSchema = z.object({
	hero: z.object({
		image: z.string(),
		imageAlt: z.string().min(1),
		lines: z.array(z.string()).min(2).max(5)
	}),
	featureSections: z.array(
		z.object({
			title: z.string(),
			paragraphs: z.array(z.string()).min(1),
			links: z.array(linkSchema).default([]),
			image: z.string(),
			imageAlt: z.string().min(1),
			tone: z.enum(['dark', 'light']),
			imageFirst: z.boolean().default(false)
		})
	),
	contactHeading: z.string(),
	contactText: z.string()
})

export const teamSchema = z.object({
	about: z.object({
		title: z.string(),
		description: z.string(),
		heroImage: z.string(),
		heroImageAlt: z.string().min(1),
		purposeTitle: z.string(),
		purposeParagraphs: z.array(z.string()),
		objectives: z.array(z.string()),
		workTitle: z.string(),
		workParagraphs: z.array(z.string())
	}),
	years: z.array(
		z.object({
			year: z.string(),
			members: z.array(
				z.object({
					name: z.string(),
					position: z.string(),
					image: z.string().optional(),
					imageAlt: z.string().optional()
				})
			)
		})
	)
})

export const navigationSchema = z.object({
	brand: z.string(),
	links: z.array(z.object({ label: z.string(), url: internalOrExternalUrlSchema })),
	resourceLabel: z.string(),
	resourceLinks: z
		.array(z.object({ label: z.string(), slug: blogTagSchema }))
		.length(blogTagSchema.options.length)
		.refine(
			(links) => new Set(links.map((link) => link.slug)).size === links.length,
			'Each resource page must appear once.'
		)
})

export const siteSchema = z.object({
	title: z.string(),
	description: z.string(),
	contact: z.object({ email: z.email() }),
	socialLinks: z.array(
		z.object({
			label: z.string(),
			url: internalOrExternalUrlSchema,
			network: z.enum(['instagram', 'twitter', 'github'])
		})
	)
})

export const announcementsSchema = z.object({
	items: z.array(
		z.object({ title: z.string(), text: z.string(), url: internalOrExternalUrlSchema.optional(), active: z.boolean() })
	)
})
