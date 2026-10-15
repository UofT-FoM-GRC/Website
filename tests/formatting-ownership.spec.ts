import { expect, test } from '@playwright/test'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const prettier = fileURLToPath(new URL('../node_modules/prettier/bin/prettier.cjs', import.meta.url))
const cmsTable = '| Funding | Amount |\n| --- | --- |\n| MSc | $30,416.28 |\n'

const checkFormatting = (path: string, source: string) =>
	spawnSync(process.execPath, [prettier, '--check', '--stdin-filepath', path], {
		cwd: root,
		input: source,
		encoding: 'utf8'
	})

test('CMS blog table saves do not fail the formatting check', () => {
	for (const path of ['src/blog/cms-formatting-regression.md', 'src/blog/nested/cms-formatting-regression.md']) {
		const result = checkFormatting(path, cmsTable)
		expect(result.status, `${path}\n${result.stdout}\n${result.stderr}`).toBe(0)
	}
})

test('code, documentation and non-CMS MDX still require formatting', () => {
	for (const [path, source] of [
		['src/utils/formatting-regression.ts', 'const amount={value:1}\n'],
		['docs/formatting-regression.md', cmsTable],
		['src/blog/formatting-regression.mdx', cmsTable]
	]) {
		const result = checkFormatting(path, source)
		expect(result.status, `${path}\n${result.stdout}\n${result.stderr}`).toBe(1)
	}
})
