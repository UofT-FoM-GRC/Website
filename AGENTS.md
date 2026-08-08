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
│   ├── admin/            # Netlify CMS configuration
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
  - Configures integrations: `@astrojs/mdx`, `@astrojs/sitemap`, `astro-icon`, `@astrojs/alpinejs`.
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

- **Routine content**: Content editors use Decap CMS only. Save a draft, notify the release webmaster, fix feedback, then publish to `dev` through Decap after go-ahead. No GitHub, Git, or local development.
- **Release**: Release webmaster uses GitHub and Netlify browser only. Self-review `dev` to `main`, confirm `Validate` and `netlify/uoft-fom-grc/deploy-preview`, then merge with a merge commit.
- **Emergency development**: Emergency developer handles all source files, local commands, Git, code, configuration, dependencies, conflicts, access recovery, and complex rollback. Routine webmaster work never requires a clone.
- **Blog Posts**: Located in `src/blog/`. Each file is a Markdown file (`.md`) with frontmatter that must adhere to the `blogSchema`.
- **Pages**: Located in `src/pages/`. Each `.astro` file corresponds to a page on the site. Dynamic routes are used for blog posts.
- **Static Assets**: Images, fonts, and other static files are in the `public/` directory.

## External workflow facts

- Production is Netlify `main`; `dev` receives branch deploys; pull requests against either branch receive deploy previews.
- Feature and dependency pull requests to `dev` use squash merge. Release pull requests from `dev` to `main` use merge commits. Rebase merge is disabled.
- `main` requires pull requests with zero mandatory approvals, `Validate`, `netlify/uoft-fom-grc/deploy-preview`, resolved conversations, and force-push/deletion blocks. Required status checks are non-strict; branches need not be up to date before merge. Administrators retain bypass ability for documented emergencies, not routine releases.
- `dev` has only force-push and deletion blocks, enforced for administrators; it has no pull-request, approval, or status-check requirement. Repository auto-delete remains enabled because protected branches are not auto-deleted.

## Commit messages

- Human-authored commits, pull-request titles, and squash messages use Conventional Commits with one Gitmoji shortcode: `type(scope): :emoji: imperative summary`.
- Scope is optional. Add `!` before `:` for a breaking change and explain it in a `BREAKING CHANGE:` footer.
- Use lowercase allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, or `revert`.
- Write an imperative, lowercase summary without a trailing period.
- Preferred pairings: `feat` → `:sparkles:`, `fix` → `:bug:`, `docs` → `:memo:`, `style` → `:art:`, `refactor` → `:recycle:`, `perf` → `:zap:`, `test` → `:white_check_mark:`, `build` → `:package:`, `ci` → `:construction_worker:`, `chore` → `:wrench:`, `revert` → `:rewind:`. Dependency upgrades may use `build(deps): :arrow_up:`; urgent fixes may use `fix: :ambulance:`.
- Examples: `feat(cms): :sparkles: add team collection`, `fix(search): :bug: handle missing index`, `docs(workflow): :memo: explain release process`.
- Decap CMS and other service-generated commits are exempt. For human-controlled squash or release messages, restore this format before merging.

## Emergency developer commands

- **Routine blog content**: Use Decap CMS; do not create Markdown files locally.
- **Source changes**: Create a page in `src/pages/` or change other source only during emergency developer work.
- **Local site**: Run `pnpm dev` only for emergency developer work.
- **Build**: Run `pnpm build` only for emergency developer work.
