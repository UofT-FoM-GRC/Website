import { glob } from 'astro/loaders'
import { defineCollection } from 'astro:content'
import {
	announcementsSchema,
	blogSchema,
	homepageSchema,
	navigationSchema,
	resourceSchema,
	siteSchema,
	teamSchema
} from './schemas'

const blog = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/blog' }),
	schema: blogSchema
})

const resources = defineCollection({
	loader: glob({ pattern: '*.json', base: './src/data/resources' }),
	schema: resourceSchema
})

const homepage = defineCollection({
	loader: glob({ pattern: 'homepage.json', base: './src/data' }),
	schema: homepageSchema
})

const team = defineCollection({
	loader: glob({ pattern: 'team.json', base: './src/data' }),
	schema: teamSchema
})

const navigation = defineCollection({
	loader: glob({ pattern: 'navigation.json', base: './src/data' }),
	schema: navigationSchema
})

const site = defineCollection({
	loader: glob({ pattern: 'site.json', base: './src/data' }),
	schema: siteSchema
})

const announcements = defineCollection({
	loader: glob({ pattern: 'announcements.json', base: './src/data' }),
	schema: announcementsSchema
})

// Export the collections; Astro will automatically register them
export const collections = { blog, resources, homepage, team, navigation, site, announcements }
