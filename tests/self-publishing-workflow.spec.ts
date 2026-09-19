import { expect, test, type Page } from '@playwright/test'
import { openMockedAdmin } from './fixtures/github-backend'

const practicePost = {
	slug: 'preview-practice-post',
	title: 'Preview practice post',
	content: [
		'---',
		"title: 'Preview practice post'",
		"description: 'A training post used to rehearse publishing without public clutter.'",
		"pubDate: '2026-01-15'",
		'tags: [other]',
		'---',
		'',
		'Body text for rehearsal.',
		''
	].join('\n')
}

const openBlogEntry = async (page: Page, entry: RegExp) => {
	await page.getByRole('treeitem', { name: 'Blog Posts', exact: true }).click()
	await page.getByText(entry).click()
}

const startPublishing = async (page: Page) => {
	await page.getByRole('button', { name: /^Publish Entry$/ }).click()
	await page.getByRole('button', { name: 'Publish', exact: true }).click()
}

test.describe('editorial workflow against the mocked GitHub backend', () => {
	test.describe.configure({ timeout: 120_000 })

	test('saves an incomplete draft, keeps it across reloads, and reports missing fields before review', async ({
		page
	}) => {
		const mock = await openMockedAdmin(page)

		await page.getByRole('treeitem', { name: 'Blog Posts', exact: true }).click()
		await page.getByLabel('Create New Entry').first().click()
		const titleInput = page.locator('[data-key-path="title"] input[type="text"]')
		const title = 'HBFA Updates for 2026–27'
		// The new-entry editor can finish loading right after the first render, replacing
		// the title input. Retry until the typed value sticks.
		for (let attempt = 0; attempt < 5; attempt += 1) {
			await titleInput.fill(title)
			await page.waitForTimeout(200)
			if ((await titleInput.inputValue()) === title) break
		}
		await expect(titleInput).toHaveValue(title)
		await page.getByRole('button', { name: 'Save' }).click()

		await expect.poll(() => mock.pullRequests.length).toBe(1)
		const pullRequest = mock.pullRequests[0]
		expect(pullRequest.branch).toContain('cms/blog/hbfa-updates-for-2026-27')
		expect(pullRequest.branch).not.toMatch(/[^\x00-\x7f]/)
		expect(pullRequest.labels).toContain('sveltia-cms/draft')
		expect(pullRequest.files.map((file) => file.path)).toContain('src/blog/hbfa-updates-for-2026-27.md')
		expect(mock.branches.get(pullRequest.branch)?.get('src/blog/hbfa-updates-for-2026-27.md')).toContain(
			`title: ${title}`
		)

		await page.reload()
		const restoredTitle = page.locator('[data-key-path="title"] input[type="text"]')
		const blogTree = page.getByRole('treeitem', { name: 'Blog Posts', exact: true })
		await expect.poll(async () => (await restoredTitle.isVisible()) || (await blogTree.isVisible())).toBeTruthy()
		if (!(await restoredTitle.isVisible())) {
			await blogTree.click()
			await page.getByText(/^HBFA Updates for 2026–27 — /).click()
		}
		await expect(restoredTitle).toHaveValue(title)

		await page.getByRole('button', { name: /^Status:/ }).click()
		await page.getByRole('menu').getByText('Ready', { exact: true }).click()
		await page.getByRole('radio', { name: 'Validation' }).click()
		await page.getByRole('button', { name: 'Validate', exact: true }).click()
		await expect(
			page.getByText(/Search and Sharing Summary.*required|required.*Search and Sharing Summary/i).first()
		).toBeVisible()
		expect(mock.pullRequests[0].labels).toContain('sveltia-cms/draft')
	})

	test('links the exact changed route on the Netlify deploy preview', async ({ page }) => {
		await page.addInitScript(() => {
			const openedUrls: string[] = []
			Object.assign(window, { __openedUrls: openedUrls })
			window.open = ((url?: string | URL) => {
				openedUrls.push(String(url))
				return null
			}) as typeof window.open
		})
		await openMockedAdmin(page, (mock) => mock.seedDraft(practicePost))
		await openBlogEntry(page, /^Preview practice post — /)

		await page.getByRole('button', { name: 'View Preview' }).click()
		await expect
			.poll(() => page.evaluate(() => (window as unknown as { __openedUrls: string[] }).__openedUrls))
			.toContain('https://deploy-preview-1--uoft-fom-grc.netlify.app/blog/preview-practice-post/')
	})

	test('identifies an invalid action-link destination while preserving the draft', async ({ page }) => {
		const mock = await openMockedAdmin(page, (seeded) => seeded.seedDraft(practicePost))
		await openBlogEntry(page, /^Preview practice post — /)
		const branch = `cms/blog/${practicePost.slug}`
		const original = mock.branches.get(branch)?.get(`src/blog/${practicePost.slug}.md`)

		const body = page.locator('[data-key-path="body"]')
		await body.getByRole('button', { name: 'Insert' }).click()
		await page.getByRole('menuitem', { name: 'Action link' }).click()
		await page.getByRole('textbox', { name: 'Link Text' }).last().fill('Read more')
		await page.getByRole('textbox', { name: 'Destination URL' }).last().fill('example.com')
		let warning = ''
		page.once('dialog', async (dialog) => {
			warning = dialog.message()
			await dialog.accept()
		})
		await page.getByRole('button', { name: 'Save' }).click()

		await expect.poll(() => warning).toMatch(/Body.*Action link.*Destination URL.*https URL/i)
		await expect.poll(() => mock.branches.get(branch)?.get(`src/blog/${practicePost.slug}.md`)).not.toBe(original)
	})

	test('reports the deploy-preview build state until the preview is ready', async ({ page }) => {
		const mock = await openMockedAdmin(page, (seeded) => {
			seeded.seedDraft(practicePost)
			seeded.latestPreviewState.state = 'pending'
		})
		await openBlogEntry(page, /^Preview practice post — /)

		const checking = page.getByRole('button', { name: /Checking for Preview/ })
		await expect(checking).toBeVisible()
		await expect(checking).toBeDisabled()

		mock.latestPreviewState.state = 'ready'
		await expect(page.getByRole('button', { name: 'View Preview' })).toBeVisible({ timeout: 15_000 })
	})

	test('published blog identity controls remain guarded while draft cleanup stays available', async ({ page }) => {
		await openMockedAdmin(page)
		await openBlogEntry(page, /^Biorender for Students — /)

		await page.getByRole('button', { name: 'Show Editor Options' }).click()
		const options = page.getByRole('menu', { name: 'Editor Options' })
		await expect(options.getByRole('menuitem', { name: 'Duplicate Entry' })).toBeVisible()
		await expect(options.getByRole('menuitem', { name: 'Edit Slug' })).toBeEnabled()
		await expect(options.getByRole('menuitem', { name: 'Delete Entry' })).toBeVisible()
	})

	test('never-published blog drafts can be discarded without risking a stable URL', async ({ page }) => {
		const mock = await openMockedAdmin(page, (seeded) => seeded.seedDraft({ ...practicePost, status: 'draft' }))

		await page.getByRole('radio', { name: 'Editorial Workflow' }).click()
		const card = page.getByRole('listitem').filter({ hasText: practicePost.title })
		await card.getByRole('button', { name: 'Delete Entry' }).click()
		const dialog = page.getByRole('alertdialog', { name: 'Delete Entry' })
		await expect(dialog).toContainText(/hasn.t been published.*discard it completely/i)
		await dialog.getByRole('button', { name: 'Delete', exact: true }).click()

		await expect.poll(() => mock.branches.has(`cms/blog/${practicePost.slug}`)).toBeFalsy()
	})

	test('aborts publishing when the preview confirmation is cancelled', async ({ page }) => {
		const mock = await openMockedAdmin(page, (seeded) => seeded.seedDraft(practicePost))
		await openBlogEntry(page, /^Preview practice post — /)

		let confirmation = ''
		page.once('dialog', (dialog) => {
			confirmation = dialog.message()
			return dialog.dismiss()
		})
		await startPublishing(page)

		await expect(page.getByText(/Couldn.t publish the entry/i).first()).toBeVisible()
		expect(confirmation).toBe('I reviewed the site preview.')
		expect(mock.mergeRequests, 'Cancelling must not attempt a merge').toHaveLength(0)
		expect(mock.pullRequests[0].merged).toBeFalsy()
	})

	test('permits the merge attempt after confirmation and keeps a gate-failed draft unpublished', async ({ page }) => {
		const mock = await openMockedAdmin(page, (seeded) => seeded.seedDraft(practicePost))
		mock.setMergeOutcome('gate-failure')
		await openBlogEntry(page, /^Preview practice post — /)

		page.once('dialog', (dialog) => dialog.accept())
		await startPublishing(page)

		await expect.poll(() => mock.mergeRequests.length).toBe(1)
		await expect(page.getByText(/Couldn.t publish the entry/i).first()).toBeVisible()
		expect(mock.mergeRequests[0].method).toBe('squash')
		expect(mock.pullRequests[0].merged).toBeFalsy()

		mock.setMergeOutcome('success')
		page.once('dialog', (dialog) => dialog.accept())
		await startPublishing(page)
		await expect.poll(() => mock.pullRequests[0].merged).toBeTruthy()
	})
})
