import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { isCurrentPost } from '../utils/blog'

const site = 'https://uoftfomgrc.ca'

const escapeXml = (value: string) =>
	value.replace(
		/[<>&'\"]/g,
		(character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[character]!
	)

const xml = (content: string) =>
	new Response(`<?xml version="1.0" encoding="UTF-8"?>${content}`, {
		headers: { 'Content-Type': 'application/xml; charset=utf-8' }
	})

export const GET: APIRoute = async () => {
	const [resources, blogs] = await Promise.all([getCollection('resources'), getCollection('blog')])
	const routes = [
		'/',
		'/about/',
		'/blog/',
		'/resources/',
		...resources.map((resource) => `/resources/${resource.data.slug}/`),
		...blogs.filter((post) => isCurrentPost(post)).map((post) => `/blog/${post.id}/`)
	]

	return xml(
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes
			.map((route) => `<url><loc>${escapeXml(new URL(route, site).href)}</loc></url>`)
			.join('')}</urlset>`
	)
}
