# Faculty of Medicine Graduate Representation Committee website

Live site: <https://uoftfomgrc.ca>

Current CMS: <https://uoftfomgrc.ca/admin/>

Support: <grc.facmed@utoronto.ca>

## Start here

- Content editor: [CMS publishing guide](docs/CONTENT_EDITOR.md)
- Release webmaster: [review and release guide](docs/REVIEW_AND_RELEASE.md)
- Emergency developer: [local development guide](docs/LOCAL_DEVELOPMENT.md)
- Rollback: [rollback guide](docs/ROLLBACK.md)
- Technical overview: [architecture](docs/ARCHITECTURE.md)
- Ownership and release handoff: [handoff checklist](docs/HANDOFF.md)

Routine work is browser-only: content editors use Decap CMS; the release webmaster uses GitHub and Netlify. CMS covers blog, resources, homepage, announcements, team archive, navigation, and contact/social links. Local Git, code, configuration, and dependency work belongs to an emergency developer.

## Current status

- Node.js `24.12.0` and pnpm `11.20.0` are pinned in repository files.
- Decap CMS `3.15.1` uses Netlify Identity and Git Gateway with editorial workflow; CMS content targets `dev`.
- Sveltia CMS `0.181.1` is staged at `/cms/` for GitHub OAuth cutover. It cannot use Git Gateway or Netlify Identity; see [architecture](docs/ARCHITECTURE.md#cms-routes-and-cutover-state).
- Release path: GitHub pull request from `dev` to `main`, then Netlify production deploy. Production is `main`; `dev` has branch deploys.
- GitHub and Netlify settings are external controls that repository files cannot prove. Record their configuration, ownership, billing, and recovery details in the organization's private handoff record.
- Handoff-improvement changes currently live on `feat/handoff-improvements`. They are not live until reviewed, merged to `dev`, and released from `dev` to `main`.
- Resource page URLs and section IDs are public-link contracts. Decap can hide a resource slug, but cannot make IDs inside a repeatable section list read-only; editors must retain existing IDs.
- The repository `LICENSE` needs an organization/legal decision before any substantive change. Do not treat this technical handoff as legal approval.

## Architecture

Astro builds static pages without a deployment adapter. Markdown blog posts live in `src/blog`; CMS JSON data lives in `src/data`; static assets and CMS routes live in `public`. GitHub stores reviewable changes. Netlify hosts generated `dist`. Pagefind creates static search files during `pnpm build`.

See [architecture](docs/ARCHITECTURE.md) for repository map and system boundaries. Do not store passwords, recovery codes, or tokens in this repository.

## Content freshness

Each blog post can have an owner, review date, expiry date, and status. The owner reviews time-sensitive material before `reviewBy`; `expiresOn` keeps a post current through its selected Toronto calendar date, then removes it from current listings at the next site build while preserving its historical URL. Set `status: archived` when superseded. Do not publish an uncertain offer, eligibility rule, date, or price as current fact.

## Emergency developer validation

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
