# Gemini Project Analysis: uoft-fom-grc-website

This document provides a summary of the project structure, technologies used, and key configurations to guide future development and maintenance.

## Project Overview

This is the official website for the University of Toronto, Faculty of Medicine's Graduate Representation Committee (GRC). It is a static website built with Astro, designed to provide information and resources to graduate students through resource pages and blog posts.

## Technologies

- **Framework**: [Astro](https://astro.build/) (v7.1.6)
- **UI Framework**: [Tailwind CSS](https://tailwindcss.com/) (v4.3.3)
- **JavaScript**: [Alpine.js](https://alpinejs.dev/) for client-side interactivity.
- **Language**: TypeScript
- **Content**: Markdown with MDX for blog posts.
- **Deployment**: [Netlify](https://www.netlify.com/)
- **Search**: [Pagefind](https://pagefind.app/) for static site search.
- **Package Manager**: pnpm

## Project Structure

```
/
├── astro.config.mjs      # Astro configuration file
├── package.json          # Project dependencies and scripts
├── pnpm-lock.yaml        # pnpm lock file
├── tsconfig.json         # TypeScript configuration
├── public/               # Static assets (images, fonts, etc.)
│   ├── admin/            # Sveltia CMS configuration
│   └── assets/           # Images used in the site
└── src/                  # Source code
    ├── components/       # Reusable Astro components
    ├── content.config.ts # Astro content collection definitions
    ├── layouts/          # Page layouts
    ├── pages/            # Site pages and routes
    ├── blog/             # Markdown files for blog posts
    ├── schemas.ts        # Zod schemas for content collections
    ├── styles/           # Global CSS styles
    └── utils/            # Utility functions
```

## Key Files & Configurations

- **`astro.config.mjs`**:
  - Sets the `site` URL to `https://uoftfomgrc.ca`.
  - Configures integrations: `@astrojs/mdx`, `astro-icon`, `@astrojs/alpinejs`.
  - Sets the output to `static`.
  - Publishes the fully static `dist` output to Netlify without an Astro deployment adapter.
  - Integrates Tailwind CSS via a Vite plugin.

- **`package.json`**:
  - Defines project scripts:
    - `dev`: Starts the development server.
    - `check`: Validates content and TypeScript with Astro.
    - `build`: Builds the site and creates the Pagefind search index.
  - Lists all project dependencies.

- **`src/content.config.ts`**:
  - Defines a `blog` content collection.
  - Loads all Markdown files from `./src/blog`.
  - Applies the `blogSchema` to all blog posts.

- **`src/schemas.ts`**:
  - Uses `zod` to define the `blogSchema`.
  - A blog post must have a `title`, `description`, `pubDate`, and an array of `tags`.
  - `updatedDate` and `heroImage` are optional.
  - Defines a `blogTagSchema` enum for blog post tags.

## Content Management

- **Routine content**: Content editors use Sveltia CMS at `/admin/` only. Saving a draft creates a short-lived CMS branch and pull request against `main`; the editor reviews the exact route in the Netlify deploy preview, answers "I reviewed the site preview.", and publishes when `Validate` and `netlify/uoft-fom-grc/deploy-preview` pass. No GitHub, Git, or local development.
- **Publishing**: Self-publishing is routine. Sveltia squash-merges the reviewed draft pull request into `main`, and Netlify deploys production. No separate release branch or release webmaster exists.
- **Emergency development**: The technical steward handles all source files, local commands, Git, code, configuration, dependencies, conflicts, access recovery, and complex rollback. Routine publishing never requires a clone.
- **Blog Posts**: Located in `src/blog/`. Each file is a Markdown file (`.md`) with frontmatter that must adhere to the `blogSchema`.
- **Pages**: Located in `src/pages/`. Each `.astro` file corresponds to a page on the site. Dynamic routes are used for blog posts.
- **Static Assets**: Images, fonts, and other static files are in the `public/` directory.

## External workflow facts

- `main` is the only long-lived branch for both content and code. Sveltia CMS drafts and developer feature/dependency branches start from `main` and merge through pull requests. The old `dev` branch is retired; do not target it.
- Sveltia draft pull requests and developer feature/dependency pull requests use squash merge. Rebase merge is disabled.
- `main` requires pull requests with zero mandatory approvals, `Validate`, `netlify/uoft-fom-grc/deploy-preview`, resolved conversations, and force-push/deletion blocks. Required status checks are non-strict; branches need not be up to date before merge. Administrators retain bypass ability for documented emergencies, not routine publishing.
- Routine content publishing has no bypass. A merge attempt from Sveltia fails while either required check fails or is missing.

## Commit messages

- Human-authored commits, pull-request titles, and squash messages use Conventional Commits with one Gitmoji shortcode: `type(scope): :emoji: imperative summary`.
- Scope is optional. Add `!` before `:` for a breaking change and explain it in a `BREAKING CHANGE:` footer.
- Use lowercase allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, or `revert`.
- Write an imperative, lowercase summary without a trailing period.
- Preferred pairings: `feat` → `:sparkles:`, `fix` → `:bug:`, `docs` → `:memo:`, `style` → `:art:`, `refactor` → `:recycle:`, `perf` → `:zap:`, `test` → `:white_check_mark:`, `build` → `:package:`, `ci` → `:construction_worker:`, `chore` → `:wrench:`, `revert` → `:rewind:`. Dependency upgrades may use `build(deps): :arrow_up:`; urgent fixes may use `fix: :ambulance:`.
- Examples: `feat(cms): :sparkles: add team collection`, `fix(search): :bug: handle missing index`, `docs(workflow): :memo: explain release process`.
- Sveltia CMS and other service-generated commits are exempt. For human-controlled squash or release messages, restore this format before merging.

## Technical steward commands

- **Routine blog content**: Use Sveltia CMS at `/admin/`; do not create Markdown files locally.
- **Source changes**: Create a page in `src/pages/` or change other source only during technical steward work.
- **Local site**: Run `pnpm dev` only for technical steward work.
- **Build**: Run `pnpm build` only for technical steward work.
- **External operations**: Follow `docs/TECHNICAL_OPERATIONS.md` for OAuth, Netlify, GitHub access/protection, expiry automation, upgrades, cutover, and annual handoff.
- **CMS rehearsal**: Use all twelve scenarios in `docs/TECHNICAL_REHEARSAL.md` before cutover or any Sveltia version change; store completed evidence privately and never record secrets.
- **Recovery**: Follow `docs/ROLLBACK.md`; a Netlify restore is temporary until `main` is reconciled, and Decap is not a live fallback.

## Playwright checks

- Browser binaries are local generated tools. Install Chromium with `pnpm exec playwright install chromium`.
- Use headless Playwright for visual/smoke checks.
- Do not commit browser binaries or generated output.
- Do not expand CI unless Playwright tests are deliberately adopted.

## Agent skills

### Issue tracker

Issues and specs use local Markdown under `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Domain docs

This is a single-context repository using root `CONTEXT.md` and `docs/adr/`. See `docs/agents/domain.md`.
