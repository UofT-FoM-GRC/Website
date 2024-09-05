import { defineCollection, z } from 'astro:content'
import { blogTagSchema } from '../consts'

const blogSchema = z.object({
	title: z.string(),
	description: z.string(),
	pubDate: z.coerce.date(),
	updatedDate: z.coerce.date().optional(),
	heroImage: z.string().optional(),
	tags: z.array(blogTagSchema)
})

const blog = defineCollection({
	type: 'content',
	schema: blogSchema
})

// Derive the blog type from the schema
export type BlogPost = z.infer<typeof blogSchema>

export const collections = { blog }
