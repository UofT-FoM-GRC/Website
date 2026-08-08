import type { CollectionEntry } from 'astro:content'

type BlogPost = CollectionEntry<'blog'>

function torontoDate(now: Date) {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'America/Toronto',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).formatToParts(now)
	const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value

	return `${value('year')}-${value('month')}-${value('day')}`
}

export function isExpiredOn(expiresOn: Date | undefined, now = new Date()) {
	// CMS dates have no time. Keep a post current through the selected Toronto calendar day.
	return Boolean(expiresOn && expiresOn.toISOString().slice(0, 10) < torontoDate(now))
}

export function isExpired(post: BlogPost, now = new Date()) {
	return isExpiredOn(post.data.expiresOn, now)
}

export function isCurrentPost(post: BlogPost, now = new Date()) {
	return post.data.status === 'published' && !isExpired(post, now)
}
