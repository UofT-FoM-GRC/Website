import type { CollectionEntry } from 'astro:content'

type BlogPost = CollectionEntry<'blog'>

const torontoCalendarFormatter = new Intl.DateTimeFormat('en-CA', {
	timeZone: 'America/Toronto',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit'
})

const blogMonthFormatter = new Intl.DateTimeFormat('en-CA', {
	timeZone: 'UTC',
	month: 'long',
	year: 'numeric'
})

export function torontoDate(now = new Date()) {
	const parts = torontoCalendarFormatter.formatToParts(now)
	const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value

	return `${value('year')}-${value('month')}-${value('day')}`
}

// CMS date fields represent calendar dates, stored as UTC YYYY-MM-DD values.
export function cmsDateKey(date: Date) {
	return date.toISOString().slice(0, 10)
}

export function blogMonthKey(date: Date) {
	return cmsDateKey(date).slice(0, 7)
}

export function formatBlogMonth(monthKey: string) {
	return blogMonthFormatter.format(new Date(`${monthKey}-01T00:00:00.000Z`))
}

export function isExpiredOn(expiresOn: Date | undefined, now = new Date()) {
	// CMS dates have no time. Keep a post current through the selected Toronto calendar day.
	return Boolean(expiresOn && cmsDateKey(expiresOn) < torontoDate(now))
}

export function isExpired(post: BlogPost, now = new Date()) {
	return isExpiredOn(post.data.expiresOn, now)
}

export function isCurrentPost(post: BlogPost, now = new Date()) {
	// Astro retains absent legacy fields; only that migration case and `current` are visible.
	return (post.data.status === undefined || post.data.status === 'current') && !isExpired(post, now)
}
