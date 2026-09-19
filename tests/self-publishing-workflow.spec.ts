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
		// The new-entry editor can finish loading right after the first render, replacing
		// the title input. Retry until the typed value sticks.
		for (let attempt = 0; attempt < 5; attempt += 1) {
			await titleInput.fill('Offline draft')
			await page.waitForTimeout(200)
			if ((await titleInput.inputValue()) === 'Offline draft') break
		}
		await expect(titleInput).toHaveValue('Offline draft')
		await page.getByRole('button', { name: 'Save' }).click()

		await expect.poll(() => mock.pullRequests.length).toBe(1)
		const pullRequest = mock.pullRequests[0]
		expect(pullRequest.branch).toContain('cms/')
		expect(pullRequest.labels).toContain('sveltia-cms/draft')
		expect(pullRequest.files.map((file) => file.path)).toContain('src/blog/offline-draft.md')
		expect(mock.branches.get(pullRequest.branch)?.get('src/blog/offline-draft.md')).toContain('title: Offline draft')

		await page.reload()
		const restoredTitle = page.locator('[data-key-path="title"] input[type="text"]')
		const blogTree = page.getByRole('treeitem', { name: 'Blog Posts', exact: true })
		await expect.poll(async () => (await restoredTitle.isVisible()) || (await blogTree.isVisible())).toBeTruthy()
		if (!(await restoredTitle.isVisible())) {
			await blogTree.click()
			await page.getByText(/^Offline draft — /).click()
		}
		await expect(restoredTitle).toHaveValue('Offline draft')

		await page.getByRole('button', { name: /^Status:/ }).click()
		await page.getByRole('menu').getByText('Ready', { exact: true }).click()
		await expect(page.getByText(/Description.*required|required.*Description/i).first()).toBeVisible()
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

	test('published blog entries offer archive or discard instead of deletion', async ({ page }) => {
		await openMockedAdmin(page)
		await openBlogEntry(page, /^Biorender for Students — /)

		await page.getByRole('button', { name: 'Show Editor Options' }).click()
		const options = page.getByRole('menu', { name: 'Editor Options' })
		await expect(options.getByRole('menuitem', { name: 'Duplicate Entry' })).toBeVisible()
		await expect(options.getByRole('menuitem', { name: 'Edit Slug' })).toBeDisabled()
		await expect(options.getByRole('menuitem', { name: /Delete/ })).toHaveCount(0)
		await expect(page.getByText(/^Delete Entry/)).toHaveCount(0)
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
