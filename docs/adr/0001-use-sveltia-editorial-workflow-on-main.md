# ADR 0001: Use Sveltia editorial workflow on main

- Status: Accepted
- Date: 2026-09-17

## Context

Routine editors may have no coding or Git knowledge. They need browser-based drafts, production-equivalent site previews, curated content controls, and self-publishing without a separate release webmaster.

The existing workflow sends CMS changes to a long-lived `dev` branch and later requires a manual `dev` to `main` release. Publishing content directly to `main` while retaining that release branch would make the branches diverge and create stale-content or conflict risk.

Decap CMS currently provides editorial drafts, but its editing experience is less suitable for the planned typed content blocks. The Sveltia version staged in this repository predates Sveltia's GitHub editorial workflow and deploy-preview support. Current Sveltia releases provide both without a paid CMS service.

## Decision

- Make an upgraded Sveltia CMS the primary routine editing interface.
- Authenticate routine editors with GitHub while hiding Git operations behind the CMS.
- Use Sveltia's editorial workflow so each draft has a short-lived branch and pull request.
- Configure content previews to open the production-equivalent deploy preview for that draft.
- Allow authors to publish their own drafts after review of a successful site preview; no second-person approval is mandatory.
- Target `main`, making a CMS Publish action the production release action.
- Retire the long-lived `dev` integration and release branch after migration. Code and dependency work also uses short-lived branches based on `main`.
- Remove Decap and its legacy authentication path when Sveltia cuts over, after a complete pre-cutover rehearsal.

## Consequences

- Routine content work becomes draft, preview, publish; no GitHub release procedure is required.
- `main` becomes the single current source for content and code.
- Required validation and deploy-preview checks must pass before a draft can merge.
- Editors require GitHub accounts and appropriate repository access, but need no Git or pull-request knowledge.
- OAuth setup and repository access remain external handoff responsibilities.
- Existing workflow, branch-protection, Dependabot, rollback, handoff, and editor documentation must be revised together.
- Sveltia upgrades require rehearsal because its editorial workflow is newer than the version currently pinned in this repository.
- A post-cutover CMS failure has no routine-editor fallback and escalates to the technical steward.

## Alternatives considered

### Extend Decap CMS

Rejected as the primary path. It can support drafts and custom components, but requires more customization around the planned typed-block editing experience.

### Publish to main and synchronize main back into dev

Rejected. Continuous reverse synchronization adds conflict handling and operational failure modes for a volunteer-maintained site.

### Keep publishing to dev and promote manually

Rejected. It preserves the current release boundary but contradicts direct self-publishing and requires a release webmaster.

### Retain Decap during a rollback window

Rejected. Keeping two interfaces and authentication paths after cutover would enlarge the handoff and support surface. Sveltia must instead pass a complete rehearsal before Decap is removed.

### Adopt a managed visual CMS

Rejected. It introduces a recurring paid dependency and billing ownership that must survive annual group turnover.
