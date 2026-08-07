# Architecture

## System flow

1. Editors use Decap CMS at `/admin/` for blog posts.
2. Netlify Identity authenticates CMS users; Git Gateway writes editorial workflow changes targeting `dev`.
3. GitHub pull requests provide review. GitHub Actions runs `CI / Validate` for pull requests targeting `dev` or `main`.
4. Release pull requests move `dev` to `main` through GitHub UI.
5. Netlify builds and hosts production from its configured production branch; confirm that branch is `main` during handoff.
6. Astro produces static pages and optimized image files without a deployment adapter; Pagefind indexes built `dist` output during `pnpm build`.

Netlify deploy-preview, Identity provider, branch protection, and billing behavior are account settings. Confirm them during handoff; repository files cannot prove them.

## Components

| Component                      | Purpose                                                    |
| ------------------------------ | ---------------------------------------------------------- |
| Astro                          | Static site framework and build.                           |
| Tailwind CSS                   | Styling.                                                   |
| Alpine.js                      | Browser interactivity.                                     |
| Decap CMS                      | Browser editor for blog content.                           |
| Netlify Identity + Git Gateway | CMS authentication and repository write path.              |
| GitHub                         | Source control, issues, pull requests, CI, and Dependabot. |
| Netlify                        | Production hosting and deployment.                         |
| Pagefind                       | Static full-text search index.                             |

## Repository map

| Location                                                | Controls                                                                 |
| ------------------------------------------------------- | ------------------------------------------------------------------------ |
| `src/pages/`                                            | Routes: home, blog, about, resources, RSS.                               |
| `src/components/`                                       | Shared page components, navigation, footer, search.                      |
| `src/layouts/`                                          | Shared page and post layouts.                                            |
| `src/styles/`                                           | Global styles.                                                           |
| `src/blog/`                                             | CMS-managed Markdown blog posts.                                         |
| `src/content.config.ts`, `src/schemas.ts`               | Blog collection and validation schema.                                   |
| `public/assets/`                                        | Public images and static assets.                                         |
| `public/admin/config.yml`                               | Decap CMS backend, target branch, collections, and fields.               |
| `astro.config.mjs`                                      | Astro integrations, site URL, static output, and build configuration.    |
| `netlify.toml`                                          | Netlify build command, publish directory, Node version.                  |
| `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` | Scripts, pinned pnpm, dependencies, dependency graph, build permissions. |
| `.github/`                                              | CI workflow, Dependabot, pull request template, issue forms.             |

## Change boundaries

CMS currently manages only `src/blog/` and uploads under `public/assets/`. It does not manage navigation, resources, team roster, homepage, or CMS configuration. Those changes need a developer pull request targeting `dev`.

Generated directories include `node_modules/`, `.astro/`, and `dist/`; do not edit or commit them. See [local development](LOCAL_DEVELOPMENT.md), [review and release](REVIEW_AND_RELEASE.md), and [handoff checklist](HANDOFF_CHECKLIST.md).

TypeScript remains at `6.0.3`: latest TypeScript 7 is outside `@astrojs/check` `0.9.10` peer range (`^5.0.0 || ^6.0.0`). This is the only direct-package compatibility exception.

Netlify needs no Astro adapter for this fully static build. `netlify.toml` publishes `dist`; Netlify Identity and Git Gateway are hosting services used by the static Decap files under `public/admin/`, not Astro server features. `/admin/` is served from the copied `dist/admin/index.html` directory index without a redirect rule.
