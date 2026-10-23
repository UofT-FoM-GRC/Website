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

// Blog page topics. Each post sits under one topic heading on the Blog page.
export const blogTopicSchema = z.enum(['funding-awards', 'tools-perks', 'study-careers'])
export type BlogTopic = z.infer<typeof blogTopicSchema>

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
			// Optional so older posts still build; posts without a topic appear under "More posts".
			topic: blogTopicSchema.optional(),
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

export const typedResourceCardSchema = z
	.object({
		title: requiredStringSchema,
		variant: z.enum(['card', 'plain']).default('card'),
		status: resourceVisibilitySchema,
		blocks: z.array(resourceBlockSchema)
	})
	.strict()

export type ResourceBlock = z.infer<(typeof resourceBlockSchemas)[keyof typeof resourceBlockSchemas]>
export type TypedResourceCard = z.infer<typeof typedResourceCardSchema>
export type ResourceCard = TypedResourceCard

export const resourceCardSchema = typedResourceCardSchema

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
				message: 'Each resource section must have a unique stable link.'
			})
		}
	})

// The photo band with a small label, a heading and one line of text at the top of the inner pages.
const pageBandSchema = z.object({
	label: requiredStringSchema,
	title: requiredStringSchema,
	description: requiredStringSchema,
	image: requiredStringSchema,
	imageAlt: requiredStringSchema
})

// A box under the homepage tagline for something the GRC is about to release.
const homepageHighlightSchema = z
	.object({
		label: requiredStringSchema,
		note: optionalCmsStringSchema,
		// A coming-soon box shows a "Coming soon" tag and is not a link until its page exists.
		comingSoon: z.boolean().default(true),
		url: optionalInternalOrExternalUrlSchema
	})
	.superRefine((box, context) => {
		if (!box.comingSoon && !box.url) {
			context.addIssue({ code: 'custom', path: ['url'], message: 'Add a link, or turn Coming Soon back on.' })
		}
	})

export const homepageSchema = z.object({
	hero: z.object({
		image: requiredStringSchema,
		imageAlt: requiredStringSchema,
		lines: z.array(requiredStringSchema).min(2).max(5)
	}),
	highlights: z.array(homepageHighlightSchema).max(3).default([])
})

const teamMemberImageSchema = z
	.object({
		name: requiredStringSchema,
		pronouns: optionalCmsStringSchema,
		position: requiredStringSchema,
		image: optionalCmsStringSchema,
		imageAlt: optionalCmsStringSchema,
		bio: optionalCmsStringSchema
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
		teamPage: pageBandSchema,
		currentYear: requiredStringSchema,
		years: z.array(
			z.object({
				year: requiredStringSchema,
				members: z.array(teamMemberImageSchema)
			})
		)
	})
	.superRefine((team, context) => {
		const seenYears = new Set<string>()
		team.years.forEach(({ year }, index) => {
			if (seenYears.has(year)) {
				context.addIssue({
					code: 'custom',
					path: ['years', index, 'year'],
					message: 'Each academic year must appear once.'
				})
			}
			seenYears.add(year)
		})
		if (!team.years.some(({ year }) => year === team.currentYear)) {
			context.addIssue({
				code: 'custom',
				path: ['currentYear'],
				message: 'Current year must match one of the listed academic years.'
			})
		}
	})

export const navigationSchema = z.object({
	brand: requiredStringSchema,
	links: z.array(
		z.object({
			label: requiredStringSchema,
			url: internalOrExternalUrlSchema,
			// A coming-soon link shows its label with a "Soon" tag and no link until the page exists.
			comingSoon: z.boolean().default(false)
		})
	),
	// How many main links come before the Resources menu; omitted puts the menu after every link.
	resourcePosition: z.number().int().min(0).optional(),
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

export const pagesSchema = z.object({
	resources: z.object({
		band: pageBandSchema,
		searchPrompt: requiredStringSchema,
		urgentContacts: z
			.array(
				z.object({
					label: requiredStringSchema,
					number: requiredStringSchema,
					url: internalOrExternalUrlSchema,
					note: optionalCmsStringSchema
				})
			)
			.default([]),
		updates: z
			.array(
				z.object({
					kind: z.enum(['new', 'coming-soon']),
					tag: optionalCmsStringSchema,
					title: requiredStringSchema,
					description: optionalCmsStringSchema,
					url: optionalInternalOrExternalUrlSchema
				})
			)
			.default([])
	}),
	blog: z.object({ band: pageBandSchema }),
	contact: z.object({ band: pageBandSchema })
})

export const createAnnouncementsSchema = () =>
	z
		.object({
			items: z
				.array(
					z.object({
						title: requiredStringSchema,
						text: requiredStringSchema,
						url: optionalInternalOrExternalUrlSchema,
						expiresOn: optionalCmsDateSchema,
						active: z.boolean()
					})
				)
				.default([])
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
