# Faculty of Medicine Graduate Representation Committee website

Live site: <https://uoftfomgrc.ca>

CMS: <https://uoftfomgrc.ca/admin/>

Support: <grc.facmed@utoronto.ca>

## Start here

- Content editor: [CMS publishing guide](docs/CONTENT_EDITOR.md)
- Reviewer or releaser: [review and release guide](docs/REVIEW_AND_RELEASE.md)
- Developer: [local development guide](docs/LOCAL_DEVELOPMENT.md)
- Incoming owners: [handoff checklist](docs/HANDOFF_CHECKLIST.md)
- Incident responder: [rollback guide](docs/ROLLBACK.md)
- Technical overview: [architecture](docs/ARCHITECTURE.md)

## Current status

- Node.js `24.12.0` and pnpm `11.20.0` are pinned in repository files.
- Decap CMS uses Netlify Identity and Git Gateway with editorial workflow; CMS content targets `dev`.
- Target release path is a pull request from `dev` to `main` in GitHub UI. Confirm Netlify production-branch settings during handoff.
- CI, rulesets, approvals, Netlify access, billing, and deploy-preview settings require GitHub or Netlify verification. This repository does not claim those settings are enabled.

## Architecture

Astro builds static pages without a deployment adapter. Markdown blog posts live in `src/blog`; static assets and Decap CMS configuration live in `public`. GitHub stores reviewable changes. Netlify hosts the generated `dist` directory. Netlify Identity and Git Gateway provide CMS authentication and repository access independently of the Astro build. Pagefind creates static search files during `pnpm build`.

See [architecture](docs/ARCHITECTURE.md) for repository map and system boundaries. Do not store passwords, recovery codes, or tokens in this repository.
