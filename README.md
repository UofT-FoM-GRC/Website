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

Routine work is browser-only: content editors use Decap CMS; the release webmaster uses GitHub and Netlify. CMS covers blog, resources, homepage, announcements, team archive, navigation, and contact/social links. Local Git, code, configuration, and dependency work belongs to an emergency developer.

## Current status

- Node.js `24.12.0` and pnpm `11.20.0` are pinned in repository files.
- Decap CMS `3.15.1` uses Netlify Identity and Git Gateway with editorial workflow; CMS content targets `dev`.
- Sveltia CMS `0.181.1` is staged at `/cms/` for GitHub OAuth cutover. It cannot use Git Gateway or Netlify Identity; see [architecture](docs/ARCHITECTURE.md#cms-routes-and-cutover-state).
- Release path: GitHub pull request from `dev` to `main`, then Netlify production deploy. Production is `main`; `dev` has branch deploys.
- GitHub and Netlify settings are external controls that repository files cannot prove. Record their configuration, ownership, billing, and recovery details in the organization's private handoff record.

## Architecture

Astro builds static pages without a deployment adapter. Markdown blog posts live in `src/blog`; CMS JSON data lives in `src/data`; static assets and CMS routes live in `public`. GitHub stores reviewable changes. Netlify hosts generated `dist`. Pagefind creates static search files during `pnpm build`.

See [architecture](docs/ARCHITECTURE.md) for repository map and system boundaries. Do not store passwords, recovery codes, or tokens in this repository.
