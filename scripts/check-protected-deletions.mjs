import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const protectedIdentityPatterns = [/^src\/blog\/[^/]+\.md$/, /^src\/data\/resources\/[^/]+\.json$/]

export const findProtectedDeletions = (paths) =>
	paths.filter((path) => protectedIdentityPatterns.some((pattern) => pattern.test(path)))

const checkGitDiff = (base, head) => {
	if (!base || !head) throw new Error('Usage: node scripts/check-protected-deletions.mjs <base> <head>')

	const deletedPaths = execFileSync('git', ['diff', '--name-only', '--diff-filter=D', base, head], {
		encoding: 'utf8'
	})
		.split('\n')
		.filter(Boolean)
	const protectedDeletions = findProtectedDeletions(deletedPaths)

	if (protectedDeletions.length) {
		console.error('Published content identities cannot be deleted; archive the content instead:')
		protectedDeletions.forEach((path) => console.error(`- ${path}`))
		process.exitCode = 1
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	checkGitDiff(process.argv[2], process.argv[3])
}
