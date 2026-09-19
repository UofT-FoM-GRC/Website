import type { Page } from '@playwright/test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { parseDocument, stringify } from 'yaml'
import { readContentFiles } from './repository-content'

/**
 * A stateful, in-memory stand-in for the GitHub REST and GraphQL APIs that Sveltia CMS
 * uses with `publish_mode: editorial_workflow`. It lets automated tests exercise draft
 * saves, review statuses, deploy-preview links, the pre-publish confirmation, and merge
 * failures without touching GitHub.
 */

export type MergeOutcome = 'success' | 'gate-failure'
export type MockFileChange = { path: string; changeType: 'ADDED' | 'MODIFIED' | 'DELETED' | 'RENAMED' }
export type MockDraftStatus = 'draft' | 'pending_review' | 'pending_publish'
export type PreviewState = 'pending' | 'ready' | 'error'

export type MockPullRequest = {
	number: number
	id: string
	title: string
	url: string
	branch: string
	headSHA: string
	isDraft: boolean
	labels: string[]
	files: MockFileChange[]
	createdAt: string
	updatedAt: string
	merged: boolean
}

export type GitHubMock = {
	pullRequests: MockPullRequest[]
	branches: Map<string, Map<string, string>>
	mergeRequests: Array<{ number: number; method: string }>
	setMergeOutcome: (outcome: MergeOutcome) => void
	latestPreviewState: { state: PreviewState }
	seedDraft: (draft: { slug: string; title: string; content: string; status?: MockDraftStatus }) => void
}

const sha = (value: string) => createHash('sha1').update(value).digest('hex')

export const installGitHubMock = async (page: Page): Promise<GitHubMock> => {
	const cmsBundle = readFileSync(new URL('../../node_modules/@sveltia/cms/dist/sveltia-cms.js', import.meta.url))
	const config = parseDocument(
		readFileSync(new URL('../../public/admin/config.yml', import.meta.url), 'utf8')
	).toJS() as Record<string, unknown>
	config.backend = {
		name: 'github',
		repo: 'grc-test/website',
		branch: 'main',
		auth_methods: ['token'],
		preview_context: 'netlify/uoft-fom-grc/deploy-preview',
		squash_merges: true
	}
	config.site_url = 'https://uoftfomgrc.example'

	const mainFiles = new Map(readContentFiles())
	const branches = new Map<string, Map<string, string>>([['main', mainFiles]])
	const pullRequests: MockPullRequest[] = []
	const mergeRequests: Array<{ number: number; method: string }> = []
	const branchChanges = new Map<string, Map<string, MockFileChange['changeType']>>()
	const findPullRequest = (number: number) => pullRequests.find((candidate) => candidate.number === number)
	let mergeOutcome: MergeOutcome = 'success'
	let pullRequestSequence = 0
	let commitSequence = 0
	const latestPreviewState: { state: PreviewState } = { state: 'ready' }

	const previewUrl = 'https://deploy-preview-1--uoft-fom-grc.netlify.app'
	const toExpressionPath = (expression: string) => {
		const separator = expression.indexOf(':')
		return { branch: expression.slice(0, separator), path: expression.slice(separator + 1) }
	}
	const contentForSha = new Map<string, string>()
	for (const content of mainFiles.values()) contentForSha.set(sha(content), content)

	const findBySha = (oid: string) => contentForSha.get(oid.replace(/^"|"$/g, ''))

	const json = (body: unknown, status = 200) => ({
		status,
		contentType: 'application/json',
		body: JSON.stringify(body)
	})

	const applyCommit = (
		branch: string,
		additions: Array<{ path: string; contents: string }>,
		deletions: Array<{ path: string }>
	) => {
		const files = branches.get(branch) ?? new Map<string, string>()
		const changes = branchChanges.get(branch) ?? new Map<string, MockFileChange['changeType']>()
		for (const { path, contents } of additions) {
			const existed = files.has(path)
			files.set(path, Buffer.from(contents, 'base64').toString('utf8'))
			changes.set(path, existed ? 'MODIFIED' : 'ADDED')
			contentForSha.set(sha(files.get(path)!), files.get(path)!)
		}
		for (const { path } of deletions) {
			files.delete(path)
			changes.set(path, 'DELETED')
		}
		branches.set(branch, files)
		branchChanges.set(branch, changes)
		commitSequence += 1
		return `commit-${commitSequence}`
	}

	const parseIndexed = (query: string, pattern: RegExp) => {
		const matches = new Map<string, string>()
		for (const match of query.matchAll(pattern)) matches.set(match[1], match[2] ?? '')
		return matches
	}

	await page.route('https://**', (route) => route.abort())
	await page.route('https://unpkg.com/@sveltia/cms@0.214.1/dist/sveltia-cms.js', (route) =>
		route.fulfill({ body: cmsBundle, contentType: 'application/javascript' })
	)
	await page.route('**/admin/config.yml**', (route) =>
		route.fulfill({ body: stringify(config), contentType: 'text/yaml' })
	)
	await page.route('**/admin/customizations.js', (route) =>
		route.fulfill({
			body: readFileSync(new URL('../../public/admin/customizations.js', import.meta.url), 'utf8'),
			contentType: 'application/javascript'
		})
	)
	await page.route('https://www.githubstatus.com/**', (route) => route.fulfill(json({ status: { indicator: 'none' } })))
	await page.route('https://api.github.com/**', async (route) => {
		const request = route.request()
		const url = new URL(request.url())
		const method = request.method()
		const segments = url.pathname.split('/').filter(Boolean)
		const body = request.postDataJSON?.() ?? undefined

		if (url.pathname === '/graphql') return route.fulfill(handleGraphQL(body))

		if (url.pathname === '/user' && method === 'GET') {
			return route.fulfill(
				json({
					id: 1,
					name: 'GRC Editor',
					login: 'grc-editor',
					email: 'editor@example.com',
					avatar_url: '',
					html_url: 'https://github.com/grc-editor',
					bot: false
				})
			)
		}

		// REST: /repos/:owner/:repo/...
		const [, owner, repo, ...rest] = segments
		if (owner !== 'grc-test' || repo !== 'website') return route.fulfill(json({ message: 'Not Found' }, 404))

		if (segments.length === 3 && method === 'GET') {
			return route.fulfill(
				json({
					id: 1,
					name: 'website',
					full_name: 'grc-test/website',
					default_branch: 'main',
					permissions: { pull: true, push: true, admin: false }
				})
			)
		}
		if (rest[0] === 'collaborators' && method === 'GET') return route.fulfill(json({}))
		if (rest[0] === 'git' && rest[1] === 'trees' && method === 'GET') {
			const requestedBranch = decodeURIComponent(rest[2] ?? 'main')
			const files = branches.get(requestedBranch) ?? branches.get('main')!
			return route.fulfill(
				json({
					tree: [...files.entries()].map(([path, content]) => ({
						path,
						type: 'blob',
						sha: sha(content),
						size: content.length
					})),
					truncated: false
				})
			)
		}
		if (rest[0] === 'git' && rest[1] === 'blobs' && method === 'GET') {
			const content = findBySha(rest[2])
			return content === undefined
				? route.fulfill(json({ message: 'Not Found' }, 404))
				: route.fulfill({ status: 200, contentType: 'text/plain', body: content })
		}
		if (rest[0] === 'git' && rest[1] === 'refs' && rest[2] === 'heads' && method === 'DELETE') {
			branches.delete(decodeURIComponent(rest.slice(3).join('/')))
			return route.fulfill(json({}, 204))
		}
		if (rest[0] === 'pulls' && rest.length === 1 && method === 'POST') {
			pullRequestSequence += 1
			const branch = body.head.replace(/^[^:]+:/, '')
			const number = pullRequestSequence
			const files = [...(branchChanges.get(branch) ?? new Map())].map(([path, changeType]) => ({ path, changeType }))
			const now = new Date().toISOString()
			const pullRequest: MockPullRequest = {
				number,
				id: `PR_node_${number}`,
				title: body.title,
				url: `https://github.com/grc-test/website/pull/${number}`,
				branch,
				headSHA: `branch-head-${number}`,
				isDraft: Boolean(body.draft),
				labels: [body.draft ? 'sveltia-cms/draft' : 'sveltia-cms/pending_review'],
				files,
				createdAt: now,
				updatedAt: now,
				merged: false
			}
			pullRequests.push(pullRequest)
			return route.fulfill(
				json({
					number,
					node_id: pullRequest.id,
					title: pullRequest.title,
					html_url: pullRequest.url,
					head: { sha: pullRequest.headSHA },
					created_at: now,
					updated_at: now
				})
			)
		}
		if (rest[0] === 'pulls' && rest.length === 2 && method === 'PATCH') {
			const pullRequest = findPullRequest(Number(rest[1]))
			if (pullRequest && body?.state === 'open') pullRequest.merged = false
			return route.fulfill(json({}, 200))
		}
		if (rest[0] === 'pulls' && rest[2] === 'files' && method === 'GET') return route.fulfill(json([]))
		if (rest[0] === 'pulls' && rest[2] === 'merge' && method === 'PUT') {
			const pullRequest = findPullRequest(Number(rest[1]))
			mergeRequests.push({ number: Number(rest[1]), method: body?.merge_method ?? 'merge' })
			if (mergeOutcome === 'gate-failure') {
				return route.fulfill(
					json({ message: 'Required status check "Validate" is expected. The merge is blocked.' }, 405)
				)
			}
			if (pullRequest) {
				pullRequest.merged = true
				const files = branches.get(pullRequest.branch)
				if (files) branches.set('main', new Map(files))
			}
			return route.fulfill(json({ merged: true, sha: 'squashed-on-main' }))
		}
		if (rest[0] === 'issues' && rest.length === 2 && method === 'GET') {
			const pullRequest = findPullRequest(Number(rest[1]))
			return route.fulfill(json({ labels: (pullRequest?.labels ?? []).map((name) => ({ name })) }))
		}
		if (rest[0] === 'issues' && rest.length === 2 && method === 'PATCH') {
			const pullRequest = findPullRequest(Number(rest[1]))
			if (pullRequest && Array.isArray(body?.labels)) {
				pullRequest.labels = body.labels.map((label: string | { name: string }) =>
					typeof label === 'string' ? label : label.name
				)
			}
			return route.fulfill(json({}))
		}
		if (rest[0] === 'issues' && rest[2] === 'labels' && method === 'POST') {
			const pullRequest = findPullRequest(Number(rest[1]))
			if (pullRequest) pullRequest.labels = body.labels
			return route.fulfill(json({}))
		}
		if (rest[0] === 'dispatches' && method === 'POST') return route.fulfill(json({}, 204))

		console.log('[mock] Unhandled REST route:', method, url.pathname)
		return route.fulfill(json({ message: `Unhandled REST route: ${method} ${url.pathname}` }, 500))
	})

	const handleGraphQL = (body: { query: string; variables?: Record<string, unknown> }) => {
		const query = body.query
		const variables = body.variables ?? {}
		const data = (value: unknown) => json({ data: value })

		if (query.includes('createCommitOnBranch')) {
			const input = variables.input as {
				branch: { branchName: string }
				fileChanges: { additions: Array<{ path: string; contents: string }>; deletions: Array<{ path: string }> }
			}
			const oid = applyCommit(input.branch.branchName, input.fileChanges.additions, input.fileChanges.deletions)
			const files: Record<string, { oid: string }> = {}
			input.fileChanges.additions.forEach(({ contents }, index) => {
				files[`file_${index}`] = { oid: sha(Buffer.from(contents, 'base64').toString('utf8')) }
			})
			return data({
				createCommitOnBranch: { commit: { oid, committedDate: new Date().toISOString(), ...files } }
			})
		}
		if (query.includes('createRef')) {
			const input = variables.input as { name: string; oid: string }
			branches.set(input.name.replace('refs/heads/', ''), new Map(branches.get('main')))
			return data({ createRef: { ref: { name: input.name } } })
		}
		if (query.includes('convertPullRequestToDraft') || query.includes('markPullRequestReadyForReview')) {
			const isDraft = query.includes('convertPullRequestToDraft')
			const input = variables.input as { pullRequestId: string }
			const pullRequest = pullRequests.find((candidate) => candidate.id === input.pullRequestId)
			if (pullRequest) pullRequest.isDraft = isDraft
			return data(
				isDraft
					? { convertPullRequestToDraft: { pullRequest: { isDraft: true } } }
					: { markPullRequestReadyForReview: { pullRequest: { isDraft: false } } }
			)
		}
		if (query.includes('node(id: $id)')) {
			const pullRequest = pullRequests.find((candidate) => candidate.id === variables.id)
			return data({ node: { state: 'OPEN', isDraft: pullRequest?.isDraft ?? true } })
		}
		if (query.includes('defaultBranchRef')) return data({ repository: { defaultBranchRef: { name: 'main' } } })
		if (query.includes('fork: repository')) {
			return data({ fork: { id: 'R_repo' }, base: { ref: { target: { oid: 'main-head' } } } })
		}
		if (query.includes('ref(qualifiedName: $branch)') && query.includes('target') && !query.includes('history')) {
			return data({ repository: { ref: { target: { oid: 'main-head' } } } })
		}
		if (query.includes('pullRequests(')) {
			return data({
				repository: {
					pullRequests: {
						nodes: pullRequests
							.filter((pullRequest) => !pullRequest.merged)
							.map((pullRequest) => ({
								id: pullRequest.id,
								number: pullRequest.number,
								title: pullRequest.title,
								url: pullRequest.url,
								isDraft: pullRequest.isDraft,
								isCrossRepository: false,
								createdAt: pullRequest.createdAt,
								updatedAt: pullRequest.updatedAt,
								headRefName: pullRequest.branch,
								headRefOid: pullRequest.headSHA,
								author: {
									login: 'grc-editor',
									avatarUrl: '',
									name: 'GRC Editor',
									email: 'editor@example.com',
									databaseId: 1
								},
								labels: { nodes: pullRequest.labels.map((name) => ({ name })) },
								files: { nodes: pullRequest.files }
							}))
					}
				}
			})
		}
		const deployKeys = parseIndexed(query, /commit_(\d+): object\(oid:/g)
		if (deployKeys.size) {
			const commits: Record<string, unknown> = {}
			for (const index of deployKeys.keys()) {
				commits[`commit_${index}`] = {
					status: {
						contexts: [
							{
								context: 'netlify/uoft-fom-grc/deploy-preview',
								state: latestPreviewState.state === 'ready' ? 'SUCCESS' : latestPreviewState.state.toUpperCase(),
								targetUrl: previewUrl,
								description:
									latestPreviewState.state === 'ready' ? 'Deploy preview ready!' : 'Deploy preview building...'
							}
						]
					},
					deployments: { nodes: [] },
					checkSuites: { nodes: [] }
				}
			}
			return data({ repository: commits })
		}
		const fileKeys = parseIndexed(query, /file_(\d+): object\(expression: "([^"]+)"\)/g)
		if (fileKeys.size) {
			const blobs: Record<string, unknown> = {}
			for (const [index, expression] of fileKeys) {
				const { branch, path } = toExpressionPath(expression)
				const content = branches.get(branch)?.get(path)
				blobs[`file_${index}`] =
					content === undefined
						? null
						: { oid: sha(content), byteSize: content.length, isBinary: false, isTruncated: false, text: content }
			}
			return data({ repository: blobs })
		}
		const contentKeys = parseIndexed(query, /content_(\d+): object\(oid: "([^"]+)"\)/g)
		if (contentKeys.size) {
			const blobs: Record<string, unknown> = {}
			for (const [index, oid] of contentKeys) {
				const content = findBySha(oid) ?? ''
				blobs[`content_${index}`] = { text: content, isTruncated: false }
			}
			return data({ repository: blobs })
		}
		const commitKeys = parseIndexed(query, /commit_(\d+): ref\(qualifiedName: \$branch\)/g)
		if (commitKeys.size) {
			const commits: Record<string, unknown> = {}
			for (const index of commitKeys.keys()) {
				commits[`commit_${index}`] = {
					target: {
						history: {
							nodes: [
								{
									author: { name: 'GRC Editor', email: 'editor@example.com', user: { id: 1, login: 'grc-editor' } },
									committedDate: '2026-09-01T00:00:00Z'
								}
							]
						}
					}
				}
			}
			return data({ repository: commits })
		}
		if (query.includes('history(first: 1, path:')) {
			const keys = parseIndexed(query, /commit_(\d+): ref\(qualifiedName: \$branch\)/g)
			const commits: Record<string, unknown> = {}
			for (const index of keys.keys()) commits[`commit_${index}`] = { target: { history: { nodes: [] } } }
			return data({ repository: commits })
		}
		if (query.includes('history(first: 1)')) {
			return data({
				repository: {
					ref: { target: { history: { nodes: [{ oid: 'main-head', message: 'Update content' }] } } }
				}
			})
		}
		if (query.includes('history(first: 100, path:')) {
			const keys = parseIndexed(query, /history_(\d+): ref\(qualifiedName: \$branch\)/g)
			const history: Record<string, unknown> = {}
			for (const index of keys.keys()) {
				history[`history_${index}`] = { target: { history: { nodes: [] } } }
			}
			return data({ repository: history })
		}
		console.log('[mock] Unhandled GraphQL operation:', query.slice(0, 240))
		return json({ errors: [{ message: `Unhandled GraphQL operation: ${query.slice(0, 120)}` }] }, 200)
	}

	await page.addInitScript(() => {
		localStorage.setItem(
			'sveltia-cms.user',
			JSON.stringify({
				backendName: 'github',
				token: 'test-token',
				login: 'grc-editor',
				name: 'GRC Editor',
				id: 1
			})
		)
	})

	const seedDraft: GitHubMock['seedDraft'] = ({ slug, title, content, status = 'pending_publish' }) => {
		pullRequestSequence += 1
		const branch = `cms/blog/${slug}`
		branches.set(branch, new Map([...mainFiles, [`src/blog/${slug}.md`, content]]))
		branchChanges.set(branch, new Map([[`src/blog/${slug}.md`, 'ADDED']]))
		const now = new Date().toISOString()
		pullRequests.push({
			number: pullRequestSequence,
			id: `PR_node_${pullRequestSequence}`,
			title,
			url: `https://github.com/grc-test/website/pull/${pullRequestSequence}`,
			branch,
			headSHA: `branch-head-${pullRequestSequence}`,
			isDraft: status === 'draft',
			labels: [`sveltia-cms/${status}`],
			files: [{ path: `src/blog/${slug}.md`, changeType: 'ADDED' }],
			createdAt: now,
			updatedAt: now,
			merged: false
		})
	}

	return {
		pullRequests,
		branches,
		mergeRequests,
		setMergeOutcome: (outcome) => {
			mergeOutcome = outcome
		},
		latestPreviewState,
		seedDraft
	}
}

export const openMockedAdmin = async (page: Page, seed?: (mock: GitHubMock) => void) => {
	const mock = await installGitHubMock(page)
	seed?.(mock)
	await page.goto('/admin/')
	await page.getByRole('treeitem', { name: 'Blog Posts', exact: true }).waitFor()
	return mock
}
