# Faculty of Medicine Graduate Representation Committee website

Live site: <https://uoftfomgrc.ca>

CMS: <https://uoftfomgrc.ca/admin/>

Support: <grc.facmed@utoronto.ca>

## Start here

- Content editor: [CMS publishing guide](docs/CONTENT_EDITOR.md)
- Publishing checks and gates: [self-publishing and checks guide](docs/REVIEW_AND_RELEASE.md)
- Technical steward: [local development guide](docs/LOCAL_DEVELOPMENT.md)
- Rollback: [rollback guide](docs/ROLLBACK.md)
- Technical overview: [architecture](docs/ARCHITECTURE.md)
- Ownership and access handoff: [handoff checklist](docs/HANDOFF.md)

Routine work is browser-only. Content editors draft, preview, and self-publish through Sveltia CMS at `/admin/`; the technical steward handles rare source, access, or recovery work. CMS covers blog, resources, homepage, announcements, team archive, navigation, and contact/social links.

## Current status

- Node.js `24.12.0` and pnpm `11.20.0` are pinned in repository files.
- Sveltia CMS `0.214.1` is the only CMS. It loads from `/admin/`, signs in with GitHub OAuth, and uses editorial workflow: each save creates a short-lived branch and pull request against `main`, and publish squash-merges it. `/cms/` permanently redirects to `/admin/`.
- Routine publishing runs draft, validate, exact Netlify deploy preview, confirm "I reviewed the site preview.", self-publish. No release webmaster and no `dev` to `main` release step exist.
- `main` is the only long-lived branch. Required checks are `Validate` (GitHub Actions) and `netlify/uoft-fom-grc/deploy-preview`; both gate routine merges. The old `dev` branch is retired and receives no releases.
- Dependabot version and GitHub Actions updates target `main` monthly.
- GitHub and Netlify settings are external controls that repository files cannot prove. Record their configuration, ownership, billing, and recovery details in the organization's private handoff record.
- Resource page URLs and section IDs are public-link contracts. Resource pages stay fixed eight-file records; section anchors are hidden from routine controls.
- The repository `LICENSE` needs an organization/legal decision before any substantive change. Do not treat this technical handoff as legal approval.

## Architecture

Astro builds static pages without a deployment adapter. Markdown blog posts live in `src/blog`; CMS JSON data lives in `src/data`; static assets and the CMS route live in `public`. GitHub stores reviewable changes. Netlify hosts generated `dist`. Pagefind creates static search files during `pnpm build`.

See [architecture](docs/ARCHITECTURE.md) for repository map and system boundaries. Do not store passwords, recovery codes, or tokens in this repository.

## Content freshness

Each blog post has `current` or `archived` visibility plus an optional `expiresOn` date. Posts remain current through their selected Toronto calendar date, then leave discovery at the next site build while preserving their historical URL. Do not publish an uncertain offer, eligibility rule, date, or price as current fact.

## Technical steward validation

After `pnpm install --frozen-lockfile`, run:

```sh
pnpm format
pnpm check
pnpm build
pnpm test
pnpm format:check
pnpm audit --prod
```

`pnpm test` serves the already-built `dist` directory. Install the local browser once when needed: `pnpm exec playwright install chromium`.
