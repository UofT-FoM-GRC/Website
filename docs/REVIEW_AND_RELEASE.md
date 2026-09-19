# Self-publishing and checks guide

Routine publishing is browser-only. A content editor saves a draft in [Sveltia CMS](CONTENT_EDITOR.md), reviews the exact changed route in the Netlify deploy preview, and self-publishes. No release webmaster and no `dev` to `main` release step exist.

## Publish a content draft

1. Sign in at <https://uoftfomgrc.ca/admin/> with GitHub.
2. Edit a task area and save. Saving may keep incomplete drafts; missing required fields are reported in the editor until they are fixed.
3. A valid save creates a short-lived CMS branch and draft pull request against `main`, which starts `Validate` and the Netlify deploy preview.
4. Open **View Preview**. It points at the changed route (blog post, resource page, homepage, about page, or settings target) on the pull request's deploy preview. While the preview builds, the CMS reports **Building…**; a failed build is shown as **Build Failed**.
5. Fix reported problems and save again. The same draft pull request is updated.
6. Move the draft to **Ready** and publish once both required checks pass. Sveltia asks for the confirmation "I reviewed the site preview."; cancelling aborts publishing, and confirming permits the merge attempt.
7. Sveltia squash-merges the pull request into `main` and deletes its branch. Netlify deploys production from `main`.

If the merge is rejected, the CMS reports that publishing failed and the draft stays unpublished on its branch. Fix the reported problem (usually a failing check or a missing required field) and publish again.

## Merge gates

Hard gates for every routine publish:

1. `Validate` succeeds.
2. `netlify/uoft-fom-grc/deploy-preview` succeeds.
3. All branch-protection conversations are resolved.
4. The "I reviewed the site preview." confirmation is accepted.

Routine content editors have no bypass. The technical steward retains GitHub administrator bypass for documented emergencies only; record the reason, actor, affected refs, skipped checks, time, and recovery action.

Do not publish, and do not bypass branch protection, while either required check fails or is missing. Escalate broken checks, preview failures, or access problems to the technical steward at <grc.facmed@utoronto.ca>.

## Merge methods

- Sveltia draft pull requests: **Squash and merge**. Sveltia performs this merge when the editor publishes.
- Developer feature and dependency pull requests targeting `main`: **Squash and merge**.
- Do not use **Rebase and merge**. It is disabled repository-wide.
- Never push directly to `main`.

## Build use

This Netlify site uses a Legacy Free usage-based plan with one concurrent build. One routine publish uses a deploy-preview build and a production deploy. The daily scheduled expiry rebuild adds one production build per day. Check monthly usage; do not migrate plans casually because credit-pricing migration is irreversible.

## Production smoke test

- Homepage loads at <https://uoftfomgrc.ca>.
- Desktop and mobile navigation work.
- Blog index and changed post load; images and alternative text are correct.
- All eight resource pages load; changed card links work.
- About page loads; changed team year/member order, names, positions, photos, and alternative text are correct.
- Search opens and returns a known term.
- Light and dark themes work.
- CMS login page loads at <https://uoftfomgrc.ca/admin/>.
- RSS and sitemap respond at `/rss.xml` and `/sitemap-index.xml`.
- Browser console has no obvious new errors.

If production fails the smoke test, stop publishing and follow [rollback](ROLLBACK.md). Escalate with production URL, published pull request, deployment URL, symptom, urgency, and screenshots.

## Dependency updates

Dependabot groups package and GitHub Actions version updates monthly, targets `main`, and allows one open pull request per ecosystem. Review required checks and the deploy preview. Major-version updates need technical-steward compatibility and local validation before merge. Dependency pull requests are human-authored squash merges and follow the repository commit-message rules.

## Related guides

- [Content editor guide](CONTENT_EDITOR.md)
- [Local development guide](LOCAL_DEVELOPMENT.md)
- [Rollback guide](ROLLBACK.md)
- [Technical operations runbook](TECHNICAL_OPERATIONS.md)
- [Technical rehearsal record](TECHNICAL_REHEARSAL.md)
