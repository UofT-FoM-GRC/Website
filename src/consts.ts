import { z } from 'astro:content'

// Define the schema for blog tags
export const blogTagSchema = z.enum([
	'teaching-assistantships',
	'career-planning-exploration',
	'financial-education',
	'health-wellness',
	'housing',
	'scholarships-bursaries-awards',
	'scholarship-award-grant-application-support'
])

// Infer the type from the schema
export type BlogTag = z.infer<typeof blogTagSchema>

export function prettifyTag(tag: BlogTag) {
	return tag.replace('-', ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

// Use the schema to validate the array
export const BLOG_TAGS = blogTagSchema.options

export const SITE_TITLE = 'Faculty of Medicine, Graduate Representation Committee'
export const SITE_DESCRIPTION = 'The official website of the Faculty of Medicine, Graduate Representation Committee'
