import type { BlogTag } from '../schemas'

function slugify(text: string): string {
	return text
		.toString()
		.toLowerCase()
		.trim()
		.replace(/\s+/g, '-') // Replace spaces with hyphens
		.replace(/&/g, '-and-') // Replace & with 'and'
		.replace(/[^\w\-]+/g, '') // Remove all non-word characters except hyphens
		.replace(/\-\-+/g, '-') // Replace multiple hyphens with single hyphen
		.replace(/^-+/, '') // Trim hyphens from start of text
		.replace(/-+$/, '') // Trim hyphens from end of text
}

export function prettifyTag(tag: BlogTag) {
	return {
		'teaching-assistantships': 'Teaching Assistantships',
		'career-planning-exploration': 'Career Planning & Exploration',
		'financial-education': 'Financial Education',
		'health-wellness': 'Health & Wellness',
		housing: 'Housing',
		'scholarships-bursaries-awards': 'Scholarships, Bursaries, and Awards',
		'scholarship-award-grant-application-support': 'Scholarship/Award/Grant Application Support'
	}[tag]
}
