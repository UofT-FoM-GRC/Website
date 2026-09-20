# Issue tracker: Local Markdown

Issues and specs for this repo live as Markdown files in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- Specification: `.scratch/<feature-slug>/spec.md`
- Tickets: `.scratch/<feature-slug>/issues/<NN>-<slug>.md`
- Use one file per ticket, numbered from `01`.
- Record `Status: open`, `Status: claimed`, or `Status: resolved` near the top.
- Record dependencies as `Blocked by: NN, NN`; omit the line when there are no blockers.
- Append discussion under `## Comments` instead of rewriting ticket history.

## Skill operations

- **Publish to the issue tracker**: create the relevant file under `.scratch/<feature-slug>/`.
- **Fetch a ticket**: read the referenced ticket file.
- **Claim a ticket**: change its status from `open` to `claimed` before implementation.
- **Resolve a ticket**: record the outcome and change its status to `resolved`.
- **Find the frontier**: choose the first numbered open ticket whose blockers are all resolved.
