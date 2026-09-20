import type { APIRoute } from 'astro'

const site = 'https://uoftfomgrc.ca'

const xml = (content: string) =>
	new Response(`<?xml version="1.0" encoding="UTF-8"?>${content}`, {
		headers: { 'Content-Type': 'application/xml; charset=utf-8' }
	})

export const GET: APIRoute = () =>
	xml(
		`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${
			new URL('/sitemap-0.xml', site).href
		}</loc></sitemap></sitemapindex>`
	)
