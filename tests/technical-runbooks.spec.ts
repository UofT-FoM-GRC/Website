import { expect, test } from '@playwright/test'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

const activeGuides = [
	'README.md',
	'AGENTS.md',
	'docs/ARCHITECTURE.md',
	'docs/CONTENT_EDITOR.md',
	'docs/HANDOFF.md',
	'docs/LOCAL_DEVELOPMENT.md',
	'docs/REVIEW_AND_RELEASE.md',
	'docs/ROLLBACK.md',
	'docs/TECHNICAL_OPERATIONS.md',
	'docs/TECHNICAL_REHEARSAL.md',
	'.github/pull_request_template.md'
]

test('technical operations guide covers every human-owned external control', () => {
	const operations = read('docs/TECHNICAL_OPERATIONS.md')

	for (const requirement of [
		'GitHub OAuth app',
		'Authorization callback URL',
		'Netlify OAuth provider',
		'NETLIFY_BUILD_HOOK_URL',
		'Write access',
		'default branch',
		'branch protection',
		'Validate',
		'netlify/uoft-fom-grc/deploy-preview',
		'Decommission',
		'Netlify Identity',
		'Git Gateway'
	]) {
		expect(operations, `Missing operations guidance for ${requirement}`).toContain(requirement)
	}

	expect(operations).toMatch(/Sveltia CMS quarterly/i)
	expect(operations).toMatch(/build usage monthly/i)
	expect(operations).toMatch(/annual access handoff/i)
})

test('rehearsal record contains all twelve scenarios and evidence fields', () => {
	const rehearsal = read('docs/TECHNICAL_REHEARSAL.md')
	const scenarios = rehearsal.match(/^## Scenario \d{2}:/gm) ?? []

	expect(scenarios).toHaveLength(12)
	for (let number = 1; number <= 12; number += 1) {
		const marker = `## Scenario ${String(number).padStart(2, '0')}:`
		const start = rehearsal.indexOf(marker)
		const next = rehearsal.indexOf('\n## Scenario ', start + marker.length)
		const section = rehearsal.slice(start, next === -1 ? rehearsal.length : next)

		expect(start, `Missing ${marker}`).toBeGreaterThan(-1)
		expect(section, `${marker} needs a result field`).toContain('**Result:**')
		expect(section, `${marker} needs an evidence field`).toContain('**Evidence:**')
	}

	for (const topic of [
		'login and repository authorization',
		'incomplete draft persistence',
		'validation recovery',
		'blog rich text',
		'image conversion',
		'resource blocks',
		'direct preview paths',
		'hard merge gates',
		'preview confirmation',
		'inactive hidden test item',
		'correction publish and emergency rollback',
		'scheduled expiry'
	]) {
		expect(rehearsal).toMatch(new RegExp(topic, 'i'))
	}
})

test('recovery guide distinguishes correction, hosting restore, source reconciliation, and full legacy restoration', () => {
	const rollback = read('docs/ROLLBACK.md')

	expect(rollback).toMatch(/correction publish/i)
	expect(rollback).toMatch(/hosting rollback|Netlify restore/i)
	expect(rollback).toMatch(/repository reconciliation/i)
	expect(rollback).toMatch(/full Decap restoration/i)
	expect(rollback).toMatch(/not (?:a )?live fallback/i)
	expect(rollback).toMatch(/Netlify Identity[\s\S]*Git Gateway/i)
})

test('active documentation uses main-only self-publishing and has no broken local Markdown links', () => {
	for (const guide of activeGuides) {
		const content = read(guide)
		expect(content, `${guide} must not instruct a dev-to-main release`).not.toMatch(
			/(?:merge|promote|release)\s+`?dev`?\s+(?:into|to)\s+`?main`?/i
		)
		expect(content, `${guide} must not assign a routine release webmaster`).not.toMatch(
			/(?:ask|send|hand|assign|contact).{0,40}release webmaster/i
		)

		for (const match of content.matchAll(/!?\[[^\]]+\]\(([^)]+)\)/g)) {
			const target = match[1].split('#', 1)[0]
			if (!target || /^(?:https?:|mailto:|tel:)/.test(target)) continue
			const targetPath = resolve(root, dirname(guide), decodeURIComponent(target))
			expect(existsSync(targetPath), `Broken link ${target} in ${guide}`).toBeTruthy()
		}
	}
})
