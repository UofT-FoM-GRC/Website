import { expect, test } from '@playwright/test'
import { existsSync, readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { parseDocument } from 'yaml'
import { findProtectedDeletions } from '../scripts/check-protected-deletions.mjs'
import { getCollection, getField, readCmsConfig as readConfig } from './fixtures/cms-config'

test('self-publishing targets main through the GitHub editorial workflow', () => {
	const { config } = readConfig()

	expect(config.backend).toMatchObject({
		name: 'github',
		repo: 'UofT-FoM-GRC/Website',
		branch: 'main',
		auth_methods: ['oauth'],
		preview_context: 'netlify/uoft-fom-grc/deploy-preview',
		squash_merges: true
	})
	expect(config.backend).not.toHaveProperty('automatic_deployments')
	expect(config.backend).not.toHaveProperty('skip_ci')
	expect(config.publish_mode).toBe('editorial_workflow')
	expect(config.site_url).toBe('https://uoftfomgrc.ca')
})

test('every editable area exposes an exact route-specific site preview', () => {
	const { config } = readConfig()
	const previewPaths: Array<[string, string | undefined]> = [
		[getCollection(config, 'blog').preview_path as string, '/blog/{{slug}}/'],
		[getCollection(config, 'resources').preview_path as string, '/resources/{{slug}}/']
	]

	for (const file of getCollection(config, 'resources').files!) {
		previewPaths.push([file.preview_path as string, '/resources/{{slug}}/'])
	}
	for (const [collectionName, fileName, path] of [
		['homepage_announcements', 'announcements', '/'],
		['homepage', 'homepage', '/'],
		['team_and_about', 'team', '/about/'],
		['advanced_site_settings', 'navigation', '/'],
		['advanced_site_settings', 'site', '/']
	] as const) {
		const file = getCollection(config, collectionName).files?.find((candidate) => candidate.name === fileName)
		expect(file, `Missing ${fileName} configuration`).toBeDefined()
		previewPaths.push([file!.preview_path as string, path])
	}

	for (const [actual, expected] of previewPaths) {
		expect(actual, `Preview path ${String(actual)}`).toBe(expected)
	}
})

test('published blog URLs and resource routes cannot be removed through routine controls', () => {
	const { config } = readConfig()
	const blog = getCollection(config, 'blog')
	const resources = getCollection(config, 'resources')

	expect(blog).toMatchObject({ folder: 'src/blog', create: true, delete: true })
	expect(blog.fields!.map((field) => field.name)).not.toContain('slug')
	expect(getField(blog.fields!, 'title').hint).toMatch(/does not change the URL/i)

	expect(resources.folder).toBeUndefined()
	expect(resources.create).toBeUndefined()
	expect(resources.files?.map((file) => file.name)).toEqual([
		'employment',
		'career-planning-exploration',
		'continuing-education',
		'health-wellness',
		'housing',
		'other',
		'scholarships-bursaries-awards',
		'scholarship-award-grant-application-support'
	])

	const sections = getField(getCollection(config, 'resources').files![0].fields, 'sections')
	expect(getField(sections.fields!, 'id')).toMatchObject({ widget: 'hidden' })
})

test('publish and unpublish guards protect reviewed previews and stable blog URLs', async () => {
	type Listener = { name: string; handler: (event: Record<string, unknown>) => unknown }
	const listeners: Listener[] = []
	const confirmMessages: string[] = []
	let confirmed = false

	runInNewContext(readFileSync(new URL('../public/admin/customizations.js', import.meta.url), 'utf8'), {
		Date,
		Intl,
		URL,
		window: {
			confirm: (message: string) => {
				confirmMessages.push(message)
				return confirmed
			},
			CMS: {
				registerEditorComponent: () => undefined,
				registerEventListener: (listener: Listener) => listeners.push(listener)
			}
		}
	})

	const publishGates = listeners.filter((listener) => listener.name === 'prePublish')
	expect(publishGates, 'Expected exactly one pre-publish confirmation').toHaveLength(1)
	const gate = publishGates[0].handler

	let mergeAttempts = 0
	const publish = async () => {
		await gate({})
		mergeAttempts += 1
	}

	confirmed = false
	await expect(publish()).rejects.toThrow(/site preview was not confirmed/i)
	expect(mergeAttempts, 'Cancelling must not reach the merge attempt').toBe(0)

	confirmed = true
	await expect(publish()).resolves.toBeUndefined()
	expect(mergeAttempts, 'Confirming permits the merge attempt').toBe(1)
	expect(confirmMessages).toEqual(['I reviewed the site preview.', 'I reviewed the site preview.'])

	const unpublishGates = listeners.filter((listener) => listener.name === 'preUnpublish')
	expect(unpublishGates, 'Expected exactly one published-blog deletion guard').toHaveLength(1)
	const unpublish = unpublishGates[0].handler
	const entry = { get: (key: string) => (key === 'collection' ? 'blog' : undefined) }
	expect(() => unpublish({ entry })).toThrow(/archive/i)
})

test('the staged /cms duplicate is gone and old bookmarks redirect to /admin/', () => {
	const netlify = readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8')

	expect(existsSync(new URL('../public/cms', import.meta.url))).toBeFalsy()
	expect(netlify).toMatch(/\[\[redirects\]\]\s*from = "\/cms"\s*to = "\/admin\/"\s*status = 301/)
	expect(netlify).toMatch(/\[\[redirects\]\]\s*from = "\/cms\/\*"\s*to = "\/admin\/"\s*status = 301/)
})

test('CI and Dependabot target main without a routine dev release', () => {
	const ci = parseDocument(readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8')).toJS() as {
		on: { pull_request: { branches: string[] }; push: { branches: string[] } }
		jobs: { validate: { name: string } }
	}
	const dependabot = parseDocument(
		readFileSync(new URL('../.github/dependabot.yml', import.meta.url), 'utf8')
	).toJS() as {
		updates: Array<{ 'package-ecosystem': string; 'target-branch': string }>
	}

	expect(ci.on.pull_request.branches).toEqual(['main'])
	expect(ci.on.push.branches).toEqual(['main'])
	expect(ci.jobs.validate.name).toBe('Validate')
	for (const update of dependabot.updates) {
		expect(update['target-branch'], `${update['package-ecosystem']} Dependabot branch`).toBe('main')
	}
})

test('CI rejects deletion of stable blog and resource identities', () => {
	expect(
		findProtectedDeletions([
			'src/blog/hbfa-explained.md',
			'src/data/resources/housing.json',
			'src/data/announcements.json',
			'public/assets/old.webp'
		])
	).toEqual(['src/blog/hbfa-explained.md', 'src/data/resources/housing.json'])

	const ci = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8')
	expect(ci).toContain('node scripts/check-protected-deletions.mjs')
	expect(ci).toContain('fetch-depth: 0')
})

test('routine publishing documentation names the required merge gates and CMS exemptions', () => {
	const release = readFileSync(new URL('../docs/REVIEW_AND_RELEASE.md', import.meta.url), 'utf8')
	const agents = readFileSync(new URL('../AGENTS.md', import.meta.url), 'utf8')

	expect(release).toContain('Validate')
	expect(release).toContain('netlify/uoft-fom-grc/deploy-preview')
	expect(release).toMatch(/self-publish/i)
	expect(release).toMatch(/branch protection|required check/i)
	expect(agents).toMatch(/service-generated commits are exempt/i)
	expect(agents).toMatch(/main.*only long-lived/i)
})
