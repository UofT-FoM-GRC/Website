# Local development guide

Use this guide for code, configuration, or local diagnosis. Content editors do not need local setup.

## Required versions

- Node.js `24.12.0` exactly; `.nvmrc`, `package.json`, CI, and Netlify configuration use this version.
- pnpm `11.20.0` exactly; `package.json` pins this version.
- Git.

Install Node.js `24.12.0`, then activate pnpm through Corepack. Do not install a global pnpm with npm.

```bash
corepack enable
corepack prepare pnpm@11.20.0 --activate
node --version
pnpm --version
```

Expected versions: `v24.12.0` and `11.20.0`. If Corepack is unavailable in your Node installation, install Node.js `24.12.0` from <https://nodejs.org/> and retry. Escalate persistent toolchain issues to <grc.facmed@utoronto.ca>.

## Fresh clone

```bash
git clone https://github.com/UofT-FoM-GRC/Website.git
cd Website
git switch --track origin/dev
pnpm install --frozen-lockfile
pnpm dev
```

Open shown local URL, normally <http://localhost:4321>. Stop server with `Ctrl+C`.

`pnpm dev` does not generate Pagefind files, so local search displays a production-build notice. Run `pnpm build`, then `pnpm preview`, to test the complete static output locally. Use a Netlify Deploy Preview for final hosting checks, including `/admin/` and Netlify Identity.

Never delete `pnpm-lock.yaml`. It pins reviewed dependencies. If installed files are damaged, remove only `node_modules`, then rerun `pnpm install --frozen-lockfile`.

## Validate change

```bash
pnpm check
pnpm build
pnpm format:check
```

`pnpm build` creates `dist` and Pagefind search files. Both are generated output. Do not commit them unless repository policy changes.

Format files you changed, not repository-wide files:

```bash
pnpm exec prettier --write path/to/changed-file
```

## Feature branch workflow

```bash
git switch dev
git pull --ff-only origin dev
git switch -c feat/short-description
```

Make focused change, run validation, push feature branch, then open pull request targeting `dev`. Use GitHub UI to merge after review. Never push or merge directly to `main`; releases use [review and release guide](REVIEW_AND_RELEASE.md).

Do not resolve unfamiliar merge conflicts by guessing. Stop, preserve work, and email <grc.facmed@utoronto.ca> with branch name, pull request URL, and `git status` output.

## Repository map

See [architecture](ARCHITECTURE.md) for source locations and [content editor guide](CONTENT_EDITOR.md) for CMS-managed blog content.
