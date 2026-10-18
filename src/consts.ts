import { blogTagSchema, type BlogTopic } from './schemas'

export const BLOG_TAGS = blogTagSchema.options
/** Topic headings on the Blog page, in page order. */
export const BLOG_TOPICS: ReadonlyArray<{ value: BlogTopic; label: string }> = [
	{ value: 'funding-awards', label: 'Funding & awards' },
	{ value: 'tools-perks', label: 'Free tools & perks' },
	{ value: 'study-careers', label: 'Study & careers' }
]
export const SITE_TITLE = 'Graduate Representation Committee (GRC), Faculty of Medicine, University of Toronto'
export const SITE_DESCRIPTION = 'Website of the Faculty of Medicine, Graduate Representation Committee (GRC)'
