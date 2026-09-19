# Local development guide

Technical-steward-only guide. Use for code, configuration, dependency, conflict, access-recovery, or complex rollback work. Routine content editors do not clone this repository or run local commands.

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
pnpm install --frozen-lockfile
pnpm dev
```

`main` is the default and only long-lived branch. Open the shown local URL, normally <http://localhost:4321>. Stop the server with `Ctrl+C`.

`pnpm dev` does not generate Pagefind files, so local search displays a production-build notice. Run `pnpm build`, then `pnpm preview`, to test the complete static output locally. Use a Netlify Deploy Preview for final hosting checks, including `/admin/` and GitHub OAuth sign-in.

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
git switch main
git pull --ff-only origin main
git switch -c feat/short-description
```

Make a focused change, run validation, push the feature branch, then open a pull request targeting `main`. Feature and dependency pull requests use **Squash and merge** after `Validate` and `netlify/uoft-fom-grc/deploy-preview` pass. Never push directly to `main`. Routine content publishing uses Sveltia CMS at `/admin/` and is documented in the [content editor guide](CONTENT_EDITOR.md).

Do not resolve unfamiliar merge conflicts by guessing. Stop, preserve work, and email <grc.facmed@utoronto.ca> with branch name, pull request URL, and `git status` output.

## Repository map

See [architecture](ARCHITECTURE.md) for source locations and [content editor guide](CONTENT_EDITOR.md) for CMS-managed content. External GitHub, OAuth, Netlify, expiry, cutover, upgrade, and annual-handoff procedures are browser-first and live in the [technical operations runbook](TECHNICAL_OPERATIONS.md); use the [technical rehearsal record](TECHNICAL_REHEARSAL.md) for any Sveltia version change.
