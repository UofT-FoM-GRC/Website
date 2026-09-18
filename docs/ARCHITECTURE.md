# Architecture

## Content flow

1. Editor uses Decap at `/admin/`; Netlify Identity + Git Gateway writes approved CMS changes to `dev`.
2. Netlify builds `dev`. Webmaster reviews exact branch deploy.
3. Webmaster manually opens `dev` → `main` PR, confirms checks/preview, then merge-commits. Netlify deploys `main` to production.
4. Astro renders static HTML; Tailwind classes remain in Astro components; Pagefind indexes `dist` during build.

## CMS data model

| Location                      | CMS content                                                    | Render owner             |
| ----------------------------- | -------------------------------------------------------------- | ------------------------ |
| `src/blog/*.md`               | Blog frontmatter and Markdown body                             | Blog layouts/cards       |
| `src/data/resources/*.json`   | Eight fixed resource URLs, cards, links, order                 | `ResourcePage.astro`     |
| `src/data/homepage.json`      | Hero, sections, images, wording, contact wording               | Homepage                 |
| `src/data/announcements.json` | Homepage announcements and display order                       | Homepage                 |
| `src/data/team.json`          | About wording, current/past team years, members, photos, order | About/profile components |
| `src/data/navigation.json`    | Header navigation and resource-menu labels/order               | Header                   |
| `src/data/site.json`          | Site metadata, public contact email, social links              | Layout, header, footer   |

`src/schemas.ts` validates every data source through Astro collections in `src/content.config.ts`. Immutable resource slugs match blog tag IDs and preserve all eight URLs. Resource-menu entries store a resource slug, not a copied URL, so menu links cannot drift from resource routes.

`src/utils/cmsAssets.ts` maps existing source images to emitted URLs. New CMS images live in `public/assets/` and are referenced directly. Current imagery remains visible; future images need no code work.

## Deployment and scheduled builds

Netlify builds production from `main` after each release merge. Because the output is static, blog posts and active announcements that reach their expiry date keep rendering the previous state until Netlify builds again. A scheduled GitHub Actions workflow (`.github/workflows/expiry-rebuild.yml`) calls a Netlify production build hook once per day at 09:00 UTC. Toronto midnight is 04:00 UTC during daylight saving and 05:00 UTC outside it, so the schedule always runs after the selected Toronto date has passed, never before it.

The workflow only POSTs the hook. It does not check out, edit, or commit content, so it cannot publish a CMS draft or change any source file. The technical steward owns the hook and secret: create a production build hook for the Netlify site and store its URL as the `NETLIFY_BUILD_HOOK_URL` repository secret in GitHub, then rotate it if it is exposed. The daily rebuild adds one production build per day (about 30 per month) to the Legacy Free plan usage already consumed by release and deploy-preview builds.

## CMS routes and cutover state

- **Now:** `/admin/` loads pinned Decap `3.15.1`, Netlify Identity, Git Gateway, and editorial workflow. Operational.
- **Staged:** `/cms/` loads pinned Sveltia `0.181.1`. It merges shared collection configuration from `/admin/config.yml` with `/cms/backend.yml`, replacing only backend settings with GitHub OAuth on `dev`.
- **Blocker:** Sveltia official docs state Git Gateway and Netlify Identity are unsupported. GitHub authorization-code flow needs GitHub OAuth app linked as Netlify site OAuth provider. This external Netlify/GitHub setting is not installed and cannot be stored in repository. Sveltia editorial workflow is also unimplemented, so post-cutover saving is direct-to-`dev`; Netlify `dev` deploy remains review authority.
- **Cutover:** organization administrator registers/links GitHub OAuth in Netlify, grants webmaster GitHub repository write access, tests `/cms/` on `dev`, checks one no-op/content change and Netlify deploy, then advertises `/cms/`. Retain `/admin/` during rollback window. Do not remove Identity/Git Gateway before successful production rehearsal.

Sveltia docs: <https://sveltiacms.app/en/docs/backends>, <https://sveltiacms.app/en/docs/backends/github>, <https://sveltiacms.app/en/docs/migration/netlify-decap-cms>.

## Boundaries

CMS manages meaningful site content and images, not components, Tailwind, schemas, CMS backend configuration, dependencies, or deployment configuration. Generated `node_modules/`, `.astro/`, and `dist/` are never committed. Emergency developer owns code/config/dependency/access recovery.
