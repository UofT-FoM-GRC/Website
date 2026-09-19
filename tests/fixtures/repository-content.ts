import { readdirSync, readFileSync } from 'node:fs'

/**
 * The repository's CMS-managed content files as [path, contents] pairs. Shared by the
 * CMS round-trip, media, and mocked-backend tests so every harness loads the same files.
 */
export const readContentFiles = () => [
	...readdirSync(new URL('../../src/blog/', import.meta.url))
		.filter((name) => name.endsWith('.md'))
		.map(
			(name) => [`src/blog/${name}`, readFileSync(new URL(`../../src/blog/${name}`, import.meta.url), 'utf8')] as const
		),
	...readdirSync(new URL('../../src/data/resources/', import.meta.url))
		.filter((name) => name.endsWith('.json'))
		.map(
			(name) =>
				[
					`src/data/resources/${name}`,
					readFileSync(new URL(`../../src/data/resources/${name}`, import.meta.url), 'utf8')
				] as const
		),
	...['announcements.json', 'homepage.json', 'team.json', 'navigation.json', 'site.json'].map(
		(name) => [`src/data/${name}`, readFileSync(new URL(`../../src/data/${name}`, import.meta.url), 'utf8')] as const
	)
]
