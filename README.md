# Faculty of Medicine Graduate Representation Committee website

Live site: <https://uoftfomgrc.ca>

CMS: <https://uoftfomgrc.ca/admin/>

Support: <grc.facmed@utoronto.ca>

## Start here

- Content editor: [CMS publishing guide](docs/CONTENT_EDITOR.md)
- Release webmaster: [review and release guide](docs/REVIEW_AND_RELEASE.md)
- Emergency developer: [local development guide](docs/LOCAL_DEVELOPMENT.md)
- Rollback: [rollback guide](docs/ROLLBACK.md)
- Technical overview: [architecture](docs/ARCHITECTURE.md)

Routine work is browser-only: content editors use Decap CMS; the release webmaster uses GitHub and Netlify. Local Git, code, configuration, and dependency work belongs to an emergency developer.

## Current status

- Node.js `24.12.0` and pnpm `11.20.0` are pinned in repository files.
- Decap CMS uses Netlify Identity and Git Gateway with editorial workflow; CMS content targets `dev`.
- Release path: GitHub pull request from `dev` to `main`, then Netlify production deploy. Production is `main`; `dev` has branch deploys.
- GitHub and Netlify settings are external controls that repository files cannot prove. Record their configuration, ownership, billing, and recovery details in the organization's private handoff record.

## Architecture

Astro builds static pages without a deployment adapter. Markdown blog posts live in `src/blog`; static assets and Decap CMS configuration live in `public`. GitHub stores reviewable changes. Netlify hosts the generated `dist` directory. Netlify Identity and Git Gateway provide CMS authentication and repository access independently of the Astro build. Pagefind creates static search files during `pnpm build`.

See [architecture](docs/ARCHITECTURE.md) for repository map and system boundaries. Do not store passwords, recovery codes, or tokens in this repository.
