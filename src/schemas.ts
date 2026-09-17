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

const emptyStringToUndefined = (value: unknown) => (value === '' ? undefined : value)

const requiredStringSchema = z.string().trim().min(1, 'Value cannot be empty.')

const optionalCmsStringSchema = z.preprocess(emptyStringToUndefined, requiredStringSchema.optional())

const optionalCmsDateSchema = z.preprocess(emptyStringToUndefined, z.coerce.date().optional())

// Blog Schema
export const blogSchema = z
	.object({
		title: requiredStringSchema,
		description: requiredStringSchema,
		pubDate: z.coerce.date(),
		updatedDate: optionalCmsDateSchema,
		heroImage: optionalCmsStringSchema,
		heroImageAlt: optionalCmsStringSchema,
		tags: z.array(blogTagSchema).min(1).max(3),
		status: z.enum(['published', 'archived']).default('published'),
		reviewBy: optionalCmsDateSchema,
		expiresOn: optionalCmsDateSchema,
		contentOwner: optionalCmsStringSchema.default('GRC')
	})
	.superRefine((post, context) => {
		if (post.heroImage && !post.heroImageAlt) {
			context.addIssue({
				code: 'custom',
				path: ['heroImageAlt'],
				message: 'Alternative text is required when a hero image is set.'
			})
		}
		if (post.expiresOn && post.expiresOn < post.pubDate) {
			context.addIssue({ code: 'custom', path: ['expiresOn'], message: 'Expiry must not predate publication.' })
		}
	})
export type BlogPost = z.infer<typeof blogSchema>

const internalOrExternalUrlSchema = z
	.string()
	.trim()
	.regex(/^(?:https?:\/\/|mailto:|tel:|\/(?!\/)|#)/, 'Use an https URL, mailto:, tel:, site-relative URL, or fragment.')

const optionalInternalOrExternalUrlSchema = z.preprocess(emptyStringToUndefined, internalOrExternalUrlSchema.optional())

const linkSchema = z.object({
	label: requiredStringSchema,
	url: internalOrExternalUrlSchema
})

const resourceListItemSchema = z.object({
	text: requiredStringSchema,
	links: z.array(linkSchema).default([]),
	items: z.array(requiredStringSchema).default([])
})

const resourceGroupSchema = z.object({
	title: requiredStringSchema,
	text: z.array(requiredStringSchema).default([]),
	links: z.array(linkSchema).default([]),
	addressLines: z.array(requiredStringSchema).default([]),
	facts: z
		.array(
			z.object({ label: requiredStringSchema, value: requiredStringSchema, url: optionalInternalOrExternalUrlSchema })
		)
		.default([])
})

const resourceCardSchema = z
	.object({
		title: requiredStringSchema,
		text: z.array(requiredStringSchema).default([]),
		links: z.array(linkSchema).default([]),
		bullets: z.array(requiredStringSchema).default([]),
		listStyle: z.enum(['unordered', 'ordered']).default('unordered'),
		listItems: z.array(resourceListItemSchema).default([]),
		groups: z.array(resourceGroupSchema).default([]),
		addressLines: z.array(requiredStringSchema).default([]),
		facts: z
			.array(
				z.object({ label: requiredStringSchema, value: requiredStringSchema, url: optionalInternalOrExternalUrlSchema })
			)
			.default([]),
		variant: z.enum(['card', 'plain']).default('card'),
		linkStyle: z.enum(['link', 'button']).default('link'),
		image: optionalCmsStringSchema,
		imageAlt: optionalCmsStringSchema
	})
	.superRefine((card, context) => {
		if (card.image && !card.imageAlt) {
			context.addIssue({
				code: 'custom',
				path: ['imageAlt'],
				message: 'Alternative text is required when an image is set.'
			})
		}
	})

export const resourceSchema = z
	.object({
		slug: blogTagSchema,
		title: requiredStringSchema,
		description: requiredStringSchema,
		cardTitle: requiredStringSchema,
		cardImage: requiredStringSchema,
		cardImageAlt: requiredStringSchema,
		sections: z.array(
			z.object({
				id: requiredStringSchema.regex(/^[a-z0-9-]+$/),
				title: requiredStringSchema,
				intro: z.array(z.string()).default([]),
				columns: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1),
				cards: z.array(resourceCardSchema).default([])
			})
		)
	})
	.superRefine((resource, context) => {
		const ids = resource.sections.map((section) => section.id)
		if (new Set(ids).size !== ids.length) {
			context.addIssue({
				code: 'custom',
				path: ['sections'],
				message: 'Each section ID must be unique within a resource page.'
			})
		}
	})

export const homepageSchema = z.object({
	hero: z.object({
		image: requiredStringSchema,
		imageAlt: requiredStringSchema,
		lines: z.array(requiredStringSchema).min(2).max(5)
	}),
	featureSections: z.array(
		z.object({
			title: requiredStringSchema,
			paragraphs: z.array(requiredStringSchema).min(1),
			links: z.array(linkSchema).default([]),
			image: requiredStringSchema,
			imageAlt: requiredStringSchema,
			tone: z.enum(['dark', 'light']),
			imageFirst: z.boolean().default(false)
		})
	),
	contactHeading: requiredStringSchema,
	contactText: requiredStringSchema
})

export const teamSchema = z
	.object({
		about: z.object({
			title: requiredStringSchema,
			description: requiredStringSchema,
			heroImage: requiredStringSchema,
			heroImageAlt: requiredStringSchema,
			purposeTitle: requiredStringSchema,
			purposeParagraphs: z.array(requiredStringSchema),
			objectives: z.array(requiredStringSchema),
			workTitle: requiredStringSchema,
			workParagraphs: z.array(requiredStringSchema)
		}),
		years: z.array(
			z.object({
				year: requiredStringSchema,
				current: z.boolean().default(false),
				members: z.array(
					z.object({
						name: requiredStringSchema,
						position: requiredStringSchema,
						image: optionalCmsStringSchema,
						imageAlt: optionalCmsStringSchema
					})
				)
			})
		)
	})
	.superRefine((team, context) => {
		if (team.years.filter((year) => year.current).length !== 1) {
			context.addIssue({ code: 'custom', path: ['years'], message: 'Select exactly one current team year.' })
		}
	})

export const navigationSchema = z.object({
	brand: requiredStringSchema,
	links: z.array(z.object({ label: requiredStringSchema, url: internalOrExternalUrlSchema })),
	resourceLabel: requiredStringSchema,
	resourceLinks: z
		.array(z.object({ label: requiredStringSchema, slug: blogTagSchema }))
		.length(blogTagSchema.options.length)
		.refine(
			(links) => new Set(links.map((link) => link.slug)).size === links.length,
			'Each resource page must appear once.'
		)
})

export const siteSchema = z.object({
	title: requiredStringSchema,
	description: requiredStringSchema,
	contact: z.object({ email: z.email() }),
	socialLinks: z.array(
		z.object({
			label: requiredStringSchema,
			url: internalOrExternalUrlSchema,
			network: z.enum(['instagram', 'github'])
		})
	)
})

export const announcementsSchema = z.object({
	items: z.array(
		z.object({
			title: requiredStringSchema,
			text: requiredStringSchema,
			url: optionalInternalOrExternalUrlSchema,
			active: z.boolean()
		})
	)
})
