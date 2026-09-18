import { z } from 'astro/zod'
import { cmsDateKey, torontoDate } from './utils/blog'

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

const requireImageDescription =
	<ImageKey extends string, DescriptionKey extends string>(imageKey: ImageKey, descriptionKey: DescriptionKey) =>
	(
		{ [imageKey]: image, [descriptionKey]: description }: Partial<Record<ImageKey | DescriptionKey, unknown>>,
		context: z.RefinementCtx
	) => {
		if (image && !description) {
			context.addIssue({
				code: 'custom',
				path: [descriptionKey],
				message: 'Image description is required when an image is set.'
			})
		}
	}

export const createBlogSchema = (now = new Date()) =>
	z
		.object({
			title: requiredStringSchema,
			description: requiredStringSchema,
			pubDate: z.coerce.date(),
			updatedDate: optionalCmsDateSchema,
			heroImage: optionalCmsStringSchema,
			heroImageAlt: optionalCmsStringSchema,
			tags: z.array(blogTagSchema).min(1).max(3),
			status: z.enum(['current', 'archived']).default('current'),
			expiresOn: optionalCmsDateSchema
		})
		.superRefine((post, context) => {
			requireImageDescription('heroImage', 'heroImageAlt')(post, context)
			if (cmsDateKey(post.pubDate) > torontoDate(now)) {
				context.addIssue({
					code: 'custom',
					path: ['pubDate'],
					message: 'Publication date cannot be in the future.'
				})
			}
			if (post.expiresOn && cmsDateKey(post.expiresOn) < cmsDateKey(post.pubDate)) {
				context.addIssue({ code: 'custom', path: ['expiresOn'], message: 'Expiry must not predate publication.' })
			}
		})

// Blog Schema
export const blogSchema = createBlogSchema()
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

const resourceFactSchema = z.object({
	label: requiredStringSchema,
	value: requiredStringSchema,
	url: optionalInternalOrExternalUrlSchema
})

const resourceGroupSchema = z.object({
	title: requiredStringSchema,
	text: z.array(requiredStringSchema).default([]),
	links: z.array(linkSchema).default([]),
	addressLines: z.array(requiredStringSchema).default([]),
	facts: z.array(resourceFactSchema).default([])
})

const optionalReplacementLinkSchema = z.preprocess((value) => {
	if (!value || typeof value !== 'object') return undefined
	const link = value as { label?: unknown; url?: unknown }
	return link.label || link.url ? value : undefined
}, linkSchema.optional())

const parseOrNever = <Schema extends z.ZodType>(schema: Schema, value: unknown, context: z.RefinementCtx) => {
	const result = schema.safeParse(value)
	if (!result.success) {
		for (const issue of result.error.issues) {
			context.addIssue({ code: 'custom', path: issue.path, message: issue.message })
		}
		return z.NEVER
	}
	return result.data
}

const textBlockSchema = z.object({ type: z.literal('text'), body: requiredStringSchema })
const imageBlockSchema = z
	.object({ type: z.literal('image'), image: requiredStringSchema, imageAlt: requiredStringSchema })
	.superRefine(requireImageDescription('image', 'imageAlt'))
const linksBlockSchema = z.object({
	type: z.literal('links'),
	appearance: z.enum(['link', 'button']).default('link'),
	items: z.array(linkSchema).min(1)
})
const stepsBlockSchema = z.object({
	type: z.literal('steps'),
	listStyle: z.enum(['unordered', 'ordered']).default('unordered'),
	items: z.array(resourceListItemSchema).min(1)
})
const contactBlockSchema = z
	.object({
		type: z.literal('contact'),
		addressLines: z.array(requiredStringSchema).default([]),
		facts: z.array(resourceFactSchema).default([])
	})
	.superRefine((block, context) => {
		if (block.addressLines.length === 0 && block.facts.length === 0) {
			context.addIssue({
				code: 'custom',
				path: ['addressLines'],
				message: 'Contact details need an address line or a labelled value.'
			})
		}
	})
const contactPanelsBlockSchema = z.object({
	type: z.literal('contact-panels'),
	panels: z.array(resourceGroupSchema).min(1)
})
const calloutBlockSchema = z.object({
	type: z.literal('callout'),
	kind: z.enum(['information', 'important', 'warning']),
	title: optionalCmsStringSchema,
	body: requiredStringSchema
})

const resourceBlockSchemas = {
	text: textBlockSchema,
	image: imageBlockSchema,
	links: linksBlockSchema,
	steps: stepsBlockSchema,
	contact: contactBlockSchema,
	'contact-panels': contactPanelsBlockSchema,
	callout: calloutBlockSchema
} as const

export const resourceBlockSchema = z.any().transform((value, context) => {
	const type = value && typeof value === 'object' && 'type' in value ? String(value.type) : ''
	if (!type) {
		context.addIssue({ code: 'custom', path: ['type'], message: 'Block type is required.' })
		return z.NEVER
	}
	if (!(type in resourceBlockSchemas)) {
		context.addIssue({ code: 'custom', path: ['type'], message: `Unknown block type "${type}".` })
		return z.NEVER
	}
	return parseOrNever(resourceBlockSchemas[type as keyof typeof resourceBlockSchemas], value, context)
})

const resourceVisibilitySchema = z.enum(['current', 'archived']).default('current')

export const typedResourceCardSchema = z.object({
	title: requiredStringSchema,
	variant: z.enum(['card', 'plain']).default('card'),
	status: resourceVisibilitySchema,
	blocks: z.array(resourceBlockSchema)
})

// Temporary compatibility for unmigrated resource pages until ticket 10.
export const legacyResourceCardSchema = z
	.object({
		title: requiredStringSchema,
		text: z.array(requiredStringSchema).default([]),
		links: z.array(linkSchema).default([]),
		bullets: z.array(requiredStringSchema).default([]),
		listStyle: z.enum(['unordered', 'ordered']).default('unordered'),
		listItems: z.array(resourceListItemSchema).default([]),
		groups: z.array(resourceGroupSchema).default([]),
		addressLines: z.array(requiredStringSchema).default([]),
		facts: z.array(resourceFactSchema).default([]),
		variant: z.enum(['card', 'plain']).default('card'),
		status: resourceVisibilitySchema,
		linkStyle: z.enum(['link', 'button']).default('link'),
		image: optionalCmsStringSchema,
		imageAlt: optionalCmsStringSchema
	})
	.superRefine(requireImageDescription('image', 'imageAlt'))

export type ResourceBlock = z.infer<(typeof resourceBlockSchemas)[keyof typeof resourceBlockSchemas]>
export type TypedResourceCard = z.infer<typeof typedResourceCardSchema>
export type LegacyResourceCard = z.infer<typeof legacyResourceCardSchema>
export type ResourceCard = TypedResourceCard | LegacyResourceCard

export const resourceCardSchema: z.ZodType<ResourceCard> = z
	.any()
	.transform((value, context) =>
		parseOrNever(
			value && typeof value === 'object' && 'blocks' in value ? typedResourceCardSchema : legacyResourceCardSchema,
			value,
			context
		)
	)

const resourceSectionSchema = z
	.object({
		id: requiredStringSchema.regex(/^[a-z0-9-]+$/),
		title: requiredStringSchema,
		intro: z.array(z.string()).default([]),
		columns: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1),
		status: resourceVisibilitySchema,
		archiveNotice: optionalCmsStringSchema,
		replacement: optionalReplacementLinkSchema,
		cards: z.array(resourceCardSchema).default([])
	})
	.superRefine((section, context) => {
		if (section.status === 'archived' && !section.archiveNotice) {
			context.addIssue({
				code: 'custom',
				path: ['archiveNotice'],
				message: 'Archived sections require a short notice.'
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
		sections: z.array(resourceSectionSchema)
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

const teamMemberImageSchema = z
	.object({
		name: requiredStringSchema,
		position: requiredStringSchema,
		image: optionalCmsStringSchema,
		imageAlt: optionalCmsStringSchema
	})
	.superRefine(requireImageDescription('image', 'imageAlt'))

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
				members: z.array(teamMemberImageSchema)
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

export const createAnnouncementsSchema = () =>
	z
		.object({
			items: z.array(
				z.object({
					title: requiredStringSchema,
					text: requiredStringSchema,
					url: optionalInternalOrExternalUrlSchema,
					expiresOn: optionalCmsDateSchema,
					active: z.boolean()
				})
			)
		})
		.superRefine((announcements, context) => {
			announcements.items.forEach((item, index) => {
				if (item.active && !item.expiresOn) {
					context.addIssue({
						code: 'custom',
						path: ['items', index, 'expiresOn'],
						message: 'Active announcements require an expiry date.'
					})
				}
			})
		})

export const announcementsSchema = createAnnouncementsSchema()
