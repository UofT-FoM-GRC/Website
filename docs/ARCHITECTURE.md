# Architecture

## Content flow

1. Editor signs in at `/admin/` with GitHub. Sveltia saves a draft to a short-lived CMS branch and opens a draft pull request against `main`.
2. GitHub Actions runs `Validate`; Netlify builds a deploy preview for the pull request. Sveltia reports the build state and links the exact changed route.
3. Editor reviews the preview, fixes any validation feedback, confirms "I reviewed the site preview.", and publishes. Sveltia squash-merges the pull request into `main`.
4. Netlify deploys `main` to production. Astro renders static HTML; Tailwind classes remain in Astro components; Pagefind indexes `dist` during build.

There is no long-lived `dev` branch and no manual release step. Developer source and dependency work uses the same route: short-lived branch, pull request against `main`, required checks, squash merge.

## CMS data model

| Location                      | CMS content                                                    | Render owner             |
| ----------------------------- | -------------------------------------------------------------- | ------------------------ |
| `src/blog/*.md`               | Blog frontmatter and Markdown body                             | Blog layouts/cards       |
| `src/data/resources/*.json`   | Eight fixed resource URLs, cards, links, order                 | `ResourcePage.astro`     |
| `src/data/homepage.json`      | Hero, sections, images, wording, contact wording               | Homepage                 |
| `src/data/announcements.json` | Homepage announcements, expiry, and display order              | Homepage                 |
| `src/data/team.json`          | About wording, current/past team years, members, photos, order | About/profile components |
| `src/data/navigation.json`    | Header navigation and resource-menu labels/order               | Header                   |
| `src/data/site.json`          | Site metadata, public contact email, social links              | Layout, header, footer   |

`src/schemas.ts` validates every data source through Astro collections in `src/content.config.ts`. Immutable resource slugs match blog tag IDs and preserve all eight URLs. Resource-menu entries store a resource slug, not a copied URL, so menu links cannot drift from resource routes.

`src/utils/cmsAssets.ts` maps existing source images to emitted URLs. New CMS images live in `public/assets/` and are referenced directly. Current imagery remains visible; future images need no code work.

## Deployment and scheduled builds

Netlify builds production from `main` after each CMS publish or merged code pull request. Because the output is static, blog posts and active announcements that reach their expiry date keep rendering the previous state until Netlify builds again. A scheduled GitHub Actions workflow (`.github/workflows/expiry-rebuild.yml`) calls a Netlify production build hook once per day at 09:00 UTC. Toronto midnight is 04:00 UTC during daylight saving and 05:00 UTC outside it, so the schedule always runs after the selected Toronto date has passed, never before it.

The workflow only POSTs the hook. It does not check out, edit, or commit content, so it cannot publish a CMS draft or change any source file. The technical steward owns the hook and secret: create a production build hook for the Netlify site and store its URL as the `NETLIFY_BUILD_HOOK_URL` repository secret in GitHub, then rotate it if it is exposed. The daily rebuild adds one production build per day (about 30 per month) to the Legacy Free plan usage already consumed by deploy-preview and production builds.

## CMS routes and access

- `/admin/` loads pinned Sveltia CMS `0.214.1` with the project configuration and `customizations.js`.
- `/cms/` permanently redirects to `/admin/`. There is no second editing surface.
- The GitHub backend authenticates through the Netlify-linked GitHub OAuth provider and targets `main` with `publish_mode: editorial_workflow`.
- `preview_context` names the `netlify/uoft-fom-grc/deploy-preview` commit status, so **View Preview** always resolves the changed route on the pull request's deploy preview.
- A `prePublish` confirmation requires "I reviewed the site preview." before Sveltia attempts the merge. Cancelling aborts the publish; the merge itself is still gated by branch protection.
- Publishing uses squash merge. Blog posts keep `delete: false`; resource pages remain fixed file records, so published URLs and protected identities survive routine editing.

Sveltia docs: <https://sveltiacms.app/en/docs/backends>, <https://sveltiacms.app/en/docs/backends/github>, <https://sveltiacms.app/en/docs/workflows/editorial>, <https://sveltiacms.app/en/docs/workflows/deploy-previews>.

## Boundaries

CMS manages meaningful site content and images, not components, Tailwind, schemas, CMS backend configuration, dependencies, or deployment configuration. Generated `node_modules/`, `.astro/`, and `dist/` are never committed. The technical steward owns code/config/dependency/access recovery.
