import { z } from 'astro:content'

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
	tags: z.array(blogTagSchema)
})
export type BlogPost = z.infer<typeof blogSchema>
