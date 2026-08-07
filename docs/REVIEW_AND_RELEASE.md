# Review and release guide

Use GitHub UI for review and releases. Do not push directly to `main`.

## Review CMS pull request

1. Confirm pull request targets `dev`.
2. Read changed text and frontmatter. Check dates, tags, links, image paths, image alternative text, and factual claims.
3. Confirm `CI / Validate` passes.
4. Open Netlify Deploy Preview when available. Check visible layout, navigation, changed page, and mobile view.
5. Request changes or record approval in pull request.
6. Tell editor to publish only after approval.

CI and Deploy Preview availability depends on repository and Netlify settings. If either is unavailable, record that fact in review and escalate unexpected configuration changes to <grc.facmed@utoronto.ca>.

## Release `dev` to `main`

1. In GitHub, select **Pull requests** then **New pull request**.
2. Set base branch to `main` and compare branch to `dev`.
3. Use release pull request template. Confirm all intended `dev` changes are included.
4. Review `CI / Validate` and Deploy Preview when available. Obtain approvals required by current GitHub settings.
5. Select **Create a merge commit**. This preserves `dev` as an ancestor of `main` for the next release.
6. Wait for Netlify production deploy linked to `main`. Read deploy log on failure.
7. Perform production smoke test below. Record result in release pull request.

Do not create a release by command-line merge or direct push. If GitHub blocks merge, do not bypass protection; email <grc.facmed@utoronto.ca> with pull request URL and check failure.

## Merge methods

- Feature and dependency pull requests targeting `dev`: use **Squash and merge**.
- Decap CMS editorial pull requests: publish through Decap after approval; do not manually merge during normal operation.
- Release pull requests from `dev` to `main`: use **Create a merge commit**.
- Do not use **Rebase and merge**.

Repository settings must therefore allow squash merges and merge commits, disable rebase merges, and leave required linear history disabled on `main`.

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

If production fails smoke test, stop further releases and follow [rollback](ROLLBACK.md). Email <grc.facmed@utoronto.ca> with production URL, release pull request, deployment URL, symptom, and urgency.

## Dependency updates

Dependabot groups package and GitHub Actions version updates monthly, targets `dev`, and allows at most one open pull request for each ecosystem. Review every update through normal CI and preview process. Major-version updates require manual release-note, compatibility, and local validation review; do not merge them as routine maintenance.

GitHub raises Dependabot security-update pull requests against default branch even when version updates target `dev`. If one targets `main`, do not merge it there as routine maintenance. Apply or retarget fix through `dev`, validate it, then use normal `dev` to `main` release. Escalate urgent exception through rollback/emergency process and copy same fix to `dev` immediately.

## Related guides

- [Content editor guide](CONTENT_EDITOR.md)
- [Local development guide](LOCAL_DEVELOPMENT.md)
- [Rollback guide](ROLLBACK.md)
- [Handoff checklist](HANDOFF_CHECKLIST.md)
