import type { BlogTag } from '../schemas'

export function slugify(text: string): string {
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

export const generateSectionAnchor = (title: string, existing: Iterable<string>) => {
	const used = new Set(existing)
	const base = slugify(title) || 'section'
	if (!used.has(base)) return base
	let suffix = 2
	while (used.has(`${base}-${suffix}`)) suffix += 1
	return `${base}-${suffix}`
}

export function prettifyTag(tag: BlogTag) {
	return {
		employment: 'Employment',
		'career-planning-exploration': 'Career Planning & Exploration',
		'health-wellness': 'Health & Wellness',
		'continuing-education': 'Continuing Education',
		housing: 'Housing',
		'scholarships-bursaries-awards': 'Scholarships, Bursaries, and Awards',
		'scholarship-award-grant-application-support': 'Scholarship/Award/Grant Application Support',
		other: 'Other'
	}[tag]
}
