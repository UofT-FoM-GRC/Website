# Review and release guide

Release webmaster routine: GitHub and Netlify browser only. Do not clone, use Git, or push directly to `main`.

## Review content for `dev`

1. Open the Decap draft or its associated pull request. Confirm it targets `dev`.
2. Check changed text and frontmatter: dates, tags, links, image paths, alternative text, and factual claims.
3. Confirm required checks pass: `Validate` and `netlify/uoft-fom-grc/deploy-preview`.
4. Open the Netlify preview. Check layout, navigation, changed page, and mobile view.
5. Send feedback, or give the content editor a publish go-ahead. The editor publishes through Decap to `dev`.

Do not give a publish go-ahead while either required check fails or is missing. Escalate broken checks, preview failures, or access problems to the emergency developer.

## Release `dev` to `main`

1. Open <https://github.com/UofT-FoM-GRC/Website/compare/main...dev?expand=1>.
2. Create the release pull request with base `main` and compare `dev`. Confirm it includes intended batched `dev` changes. Ask content editors to pause Decap publishing until the release finishes.
3. Self-review changed files, production impact, and the pull request checklist. No second human review is required.
4. Confirm `Validate` and `netlify/uoft-fom-grc/deploy-preview` pass and all conversations are resolved.
5. Make the release decision. Select **Create a merge commit**; do not squash or rebase this release.
6. Wait for the Netlify production deploy from `main`. Read the deploy log if it fails.
7. Run the production smoke test. Record the decision and result in the release pull request, then tell content editors that publishing may resume.

Do not bypass protection. If GitHub blocks the release, checks fail, a conflict appears, or production fails, stop and escalate to the emergency developer with relevant URLs and screenshots.

## Merge methods

- Feature and dependency pull requests targeting `dev`: use **Squash and merge**.
- Decap CMS editorial changes: publish through Decap after the webmaster's go-ahead; do not manually merge during routine operation.
- Release pull requests from `dev` to `main`: use **Create a merge commit**.
- Do not use **Rebase and merge**.

Squashing a feature or dependency pull request turns its work-in-progress commits into one clear change on `dev`, making history and rollback easier. A release merge commit keeps the exact `dev` commits in `main` and adds one visible marker for the production release. Rebase merge is disabled because replaying commits changes their identities and removes that release boundary.

Repository settings allow squash merges and merge commits, disable rebase merges, and keep required linear history disabled on `main`.

Required status checks on `main` are non-strict: `dev` does not need to contain the previous release merge commit. One release webmaster pauses Decap publishing during release, so routine releases have no concurrent writers. After any exceptional main-only change or rollback, the emergency developer must reconcile `dev` before the next release.

## Build use

This Netlify site uses a Legacy Free usage-based plan with one concurrent build. The standard release path uses four Netlify builds: content preview, `dev` branch deploy, release preview, and production deploy. Batch ready `dev` changes into releases. Check monthly usage; do not migrate plans casually because credit-pricing migration is irreversible.

## Production smoke test

- Homepage loads at <https://uoftfomgrc.ca>.
- Desktop and mobile navigation work.
- Blog index and changed post load; images and alternative text are correct.
- Resource pages load.
- Search opens and returns a known term.
- Light and dark themes work.
- CMS login page loads at <https://uoftfomgrc.ca/admin/>.
- RSS and sitemap respond at `/rss.xml` and `/sitemap-index.xml`.
- Browser console has no obvious new errors.

If production fails smoke test, stop further releases and follow [rollback](ROLLBACK.md). Escalate with production URL, release pull request, deployment URL, symptom, urgency, and screenshots.

## Dependency updates

Dependabot groups package and GitHub Actions version updates monthly, targets `dev`, and allows one open pull request per ecosystem. Review required checks and preview. Major-version updates need emergency-developer compatibility and local validation before release.

GitHub can raise Dependabot security-update pull requests against the default branch even when version updates target `dev`. Do not merge one targeting `main` as routine maintenance. Emergency developer applies or retargets it through `dev`, validates it, then uses the normal release path. Record any urgent exception and reconcile it to `dev` immediately.

## Related guides

- [Content editor guide](CONTENT_EDITOR.md)
- [Local development guide](LOCAL_DEVELOPMENT.md)
- [Rollback guide](ROLLBACK.md)
