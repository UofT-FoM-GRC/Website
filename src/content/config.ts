import { defineCollection } from 'astro:content'
import { blogSchema } from '../schemas'

const blog = defineCollection({
	type: 'content',
	schema: blogSchema
})

// Export the collections; Astro will automatically register them
export const collections = { blog }
