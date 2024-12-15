import { glob } from 'astro/loaders'
import { defineCollection } from 'astro:content'
import { blogSchema } from './schemas'

const blog = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/blog' }),
	schema: blogSchema
})

// Export the collections; Astro will automatically register them
export const collections = { blog }
