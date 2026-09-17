# CMS handoff implementation specification

Status: Approved for implementation

## Goal

Give an annually designated, nontechnical content editor a browser-only workflow to draft, validate, preview, and self-publish GRC website content. Preserve current public design and stable URLs while making structured elements such as callouts insertable without Markdown, HTML, Tailwind, Git, or pull-request knowledge.

Architecture rationale lives in [ADR 0001](adr/0001-use-sveltia-editorial-workflow-on-main.md). Canonical content language lives in [`CONTEXT.md`](../CONTEXT.md).

## Success state

Routine workflow:

1. Editor signs in at `/admin/` with GitHub.
2. Editor chooses a task-based area: Blog, Resources, Announcements, Homepage, Team/About, or Advanced Settings.
3. Editor writes with labelled fields, rich text, and curated insert controls.
4. Editor may save an incomplete content draft across sessions. CMS identifies missing required fields; an exact site preview is unavailable until validation succeeds.
5. A valid save opens a short-lived CMS branch and pull request and starts `Validate` plus Netlify deploy-preview checks.
6. Editor opens **View Preview**, which points to the changed page in the production-equivalent Netlify deploy preview.
7. Both required checks must pass. CMS asks the editor to confirm that they reviewed the site preview.
8. Editor publishes their own draft. Sveltia merges it to `main`; Netlify deploys production.

No routine step exposes Git commands, branches, pull requests, Netlify, local tools, or source syntax.

## Scope boundaries

### Included

- Upgrade staged Sveltia CMS and make it the only production CMS.
- GitHub OAuth, Sveltia editorial workflow, deploy-preview links, and self-publishing to `main`.
- Curated rich-text components for blogs.
- Typed content blocks inside resource cards while retaining resource sections and card grids.
- Migration of existing blog callouts/raw markup and every resource card.
- Automatic image normalization and required image descriptions.
- Automatic expiry for blogs and active homepage announcements.
- Stable published blog URLs and stable resource-section anchors.
- Task-based CMS navigation, in-CMS guidance, and a short browser-accessible editor guide.
- Updated branch, CI, dependency, release, rollback, and handoff workflows.

### Excluded

- Visitor-facing redesign beyond new semantic block styles and archived-content states.
- Exact rendering while typing. Saved deploy previews remain authoritative.
- Freeform layout, color, spacing, icon, or Tailwind controls in routine CMS.
- Mandatory second-person review.
- Scheduled future publication.
- Recurring paid CMS or media service.
- Full phone editing support; routine editing requires laptop or desktop.
- Alumni access policy after this handoff. Launch needs one current content editor plus the technical steward.

## Roles and access

### Content editor

- Uses Sveltia for all routine content work.
- Has repository Write access required by Sveltia's GitHub backend.
- Has no GitHub organization administration or Netlify administration.
- May self-publish after checks and preview confirmation.

### Technical steward

- Retains GitHub organization and Netlify administration.
- Owns OAuth setup, access recovery, CMS upgrades, conflicts, broken builds, emergency rollback, and source-level work.
- Reviews and pins Sveltia upgrades quarterly or before annual handoff.
- Does not participate in routine publishing.

### Power user

- Uses Sveltia Developer Mode and GitHub browser source view for deliberate source-level work.
- Sends source changes through a short-lived branch, checks, and deploy preview.
- Keeps routine rich-text mode free of raw Markdown, HTML, and Tailwind controls.

## CMS platform

- Replace Decap at `/admin/` with an exactly pinned, rehearsed Sveltia release. Start implementation from Sveltia `0.214.1` or a newer version deliberately selected and tested at implementation time.
- Consolidate configuration under `/admin/`; remove staged `/cms/` duplication after cutover. Redirect `/cms/` to `/admin/` if preserving old bookmarks costs no separate CMS surface.
- Use GitHub backend for `UofT-FoM-GRC/Website`, branch `main`, and `publish_mode: editorial_workflow`.
- Use GitHub authorization-code OAuth through the Netlify-linked GitHub OAuth provider.
- Set `site_url` and collection/file `preview_path` values so Sveltia links directly to changed routes.
- Keep automatic deployments enabled for saved drafts. Do not expose Sveltia's skip-CI/manual-deploy mode to routine editors.
- Disable Sveltia's split preview pane globally. Rich-text fields retain inline editing feedback; **View Preview** is the sole authoritative preview.
- Keep rich-text mode only. Omit raw mode, code blocks, heading one, and presentation controls from routine toolbars.
- Keep `sanitize_preview` enabled.
- Register a pre-publish confirmation: “I reviewed the site preview.”
- Set `delete: false` where a public URL or anchor must survive.

## CMS information architecture

Expose task-based top-level areas:

1. **Blog Posts**
2. **Resource Pages**
3. **Homepage Announcements**
4. **Homepage**
5. **Team and About Page**
6. **Advanced Site Settings**
   - Navigation
   - Contact and social links

Use plain labels, concise examples, and actionable validation messages. Routine labels must avoid `slug`, `frontmatter`, `schema`, `branch`, and `section ID`. Advanced settings must be clearly marked as broad site changes.

## Blog model and editor

Keep blogs as Markdown documents with YAML frontmatter. Preserve each existing file name and `/blog/{id}/` route.

### Fields

- **Title**: required.
- **Search and sharing summary**: required description with length guidance.
- **Publication date**: defaults to current Toronto date. Publishing with a future date fails with a clear message.
- **Last updated**: hidden from routine input. Set automatically to current Toronto date whenever an existing post is saved with changes.
- **Visibility**: `current` or `archived`; label this independently from Sveltia's Draft workflow state. Change the schema default and any stored `published` value to `current` during migration.
- **Expires after**: optional Toronto calendar date. Content remains current through that date.
- **Hero image**: optional image paired with a required image description whenever present.
- **Categories**: one to three existing resource categories.
- **Body**: rich-text-only document editor.

Remove `reviewBy` and `contentOwner` from CMS, schema, content, tests, and documentation.

### Rich-text controls

Allow:

- headings two through four;
- bold and italic;
- links;
- bulleted and numbered lists;
- semantic image insertion with required image description;
- semantic callout insertion;
- action-link insertion.

Do not expose heading one, strikethrough, inline/code blocks, raw Markdown, raw HTML, Tailwind, arbitrary color, or arbitrary layout.

### Callout component

Fields:

- semantic kind: `information`, `important`, or `warning`;
- optional short heading;
- formatted body;

Render every kind with a visible text label and icon; color cannot be the only distinction. Support light/dark themes and reduced-motion preferences. Nested callouts are invalid.

Store callouts as semantic Markdown directives or equivalent presentation-independent syntax. A shared renderer owns public classes. Source content must not store Tailwind classes for supported callouts.

### Action link component

Fields:

- link text;
- validated destination;
- optional short supporting text.

Template controls button styling. Editors do not select colors or spacing.

## Resource-page model and editor

Retain all eight fixed resource routes and this hierarchy:

`resource page → resource section → card grid → resource card → content blocks`

### Resource pages

- Creation, deletion, and route editing remain unavailable.
- Preserve page title, metadata description, landing-card title/image/image description, and section ordering.

### Resource sections

- Preserve every existing section anchor.
- Hide anchor values from routine editor controls.
- Generate a readable, unique anchor from a new section's initial heading on first save. Later heading changes never alter it.
- Retain constrained cards-per-row choices of one, two, or three.
- Add state `current` or `archived`.
- Archiving requires a short notice and allows an optional replacement link.
- Archived sections retain heading and anchor, render the notice, leave quick navigation, and are excluded from Pagefind indexing.
- Existing anchors may never be repurposed for unrelated content.

### Resource cards

- Preserve title, panel/plain appearance, grid placement, and ordering.
- Replace the current large set of simultaneous optional fields with one reorderable variable-type block list.
- Allow cards to be archived in CMS. Archived cards remain in stored history but do not render because cards have no public identity of their own.

### Resource-card blocks

Provide only the smallest complete palette needed by current content plus callouts:

- **Formatted text**: paragraphs, links, emphasis, and bullet lists.
- **Image**: normalized image plus required image description.
- **Links/actions**: one or more labelled destinations with constrained link or button appearance.
- **Steps**: ordered or unordered items, optional per-step links, and one nested item level.
- **Contact details**: address lines and labelled values with optional destinations.
- **Contact panels**: current grouped contact-panel structure.
- **Callout**: same semantic kinds and renderer as blogs.

Block schemas are discriminated unions. Unknown block types fail validation with a path-specific message.

## Other task areas

### Homepage announcements

- Keep manual activation; there is no scheduled start.
- Every active announcement requires an expiry date.
- Announcement remains visible through selected Toronto date, then hides on next scheduled expiry build.
- Inactive training announcement may be used to verify the production publish path without public clutter.

### Homepage

- Retain purpose-built hero, feature-section, links, image, tone, ordering, and contact fields.
- Keep the second hero line as the page heading, with existing two-to-five-line constraint and clearer hint.

### Team and About

- Retain purpose-built About fields and ordered team-year/member records.
- Replace independent `current` booleans with one explicit current-year selection so exactly one year is current.
- Require image descriptions for every supplied member photo.
- Preserve standard avatar behavior when no photo exists.

### Advanced site settings

- Keep navigation and contact/social data editable.
- Preserve fixed resource routes by selecting resource records rather than typing URLs.
- Validate internal, HTTPS, `mailto:`, `tel:`, and fragment destinations with clear examples.

## Media workflow

Keep repository-backed media; add no paid media service.

Configure Sveltia internal-media transformations:

- accept routine JPEG, PNG, and WebP raster uploads;
- convert raster uploads to WebP;
- constrain output within 2048 × 2048 without upscaling or changing aspect ratio;
- use WebP quality 85;
- slugify file names;
- reject unsupported or excessive inputs with a plain-language message;
- retain existing assets and paths unless a content migration requires replacement.

Every CMS image control pairs image source with required image description. The schema enforces the pair for hero, landing-card, resource-block, rich-text, homepage, About, and team images.

## Content lifecycle and discovery

### Manual publication

- No scheduled future publication.
- Future publication dates fail validation and block preview/publish.
- Saving an incomplete draft remains allowed.

### Automatic expiry

- Blog and active-announcement expiry uses `America/Toronto` calendar semantics.
- Content remains visible through the selected date.
- Add a daily scheduled workflow that triggers a Netlify production rebuild after Toronto midnight. A stable UTC schedule may run later than midnight across daylight-saving changes; it must never expire content early.
- Scheduled workflow changes no source content and never publishes a draft.
- Document and monitor added Legacy Free Netlify build usage.

### Archive and expiry behavior

Archived or expired blogs:

- remain accessible at their stable direct URL;
- show the existing prominent historical-content notice;
- leave blog and related-resource listings;
- leave Pagefind search;
- leave sitemap output;
- receive search-engine `noindex` metadata.

Archived resource sections retain only their direct anchor, heading, and archive notice and leave quick navigation and Pagefind search.

## Validation and publishing controls

Hard publishing gates:

1. GitHub `Validate` succeeds.
2. `netlify/uoft-fom-grc/deploy-preview` succeeds.
3. All branch-protection conversations are resolved.
4. Sveltia pre-publish preview confirmation is accepted.

Routine content editor has no bypass. Technical steward retains administrator bypass for documented emergencies only.

Validation must cover:

- required text and image descriptions;
- one-to-three valid blog categories;
- non-future publication dates;
- expiry not before publication and required expiry on active announcements;
- valid internal/external/contact links;
- fixed and complete resource routes;
- unique immutable resource-section anchors;
- valid block discriminators and nested block data;
- one current team year;
- archived-section notice presence;
- content formats safe for Astro rendering.

## Branch and deployment workflow

- `main` becomes the only long-lived source branch.
- Sveltia draft branches and developer feature/dependency branches start from `main` and merge through pull requests.
- Keep main protections: pull request required, zero mandatory approvals, required `Validate` and Netlify deploy-preview checks, resolved conversations, force-push/deletion blocks, administrator emergency bypass.
- Preserve service-generated commit-message exemption for CMS commits.
- Retarget Dependabot from `dev` to `main`.
- Remove `dev` triggers from CI after cutover.
- Change repository default branch to `main` if needed.
- Merge or explicitly reconcile every remaining `dev` change, then delete the protected `dev` branch only after production verification.
- Netlify production remains `main`; branch deploy for `dev` is removed.

## Migration

Perform migration on one short-lived feature branch. No mixed production model.

1. Add shared block types, renderers, schemas, and tests.
2. Migrate all existing blog raw HTML/Tailwind callouts, inline SVG callout icons, raw image tags, and manual line-break markup to supported semantic rich text/components. Preserve wording and links unless correcting a verified defect.
3. Classify each existing callout by meaning, not its former color. Review ambiguous mappings manually.
4. Migrate every resource card's paragraphs, bullets, links, steps, addresses, facts, groups, and images into ordered typed blocks. Preserve section/card order, columns, anchors, links, and rendered information.
5. Add lifecycle states/notices without changing current public visibility.
6. Remove unused blog review/owner fields and automate updated dates.
7. Add announcement expiry and current-team selection.
8. Upgrade and configure Sveltia at `/admin/`; keep Decap operational on production until the cutover merge.
9. Update all workflow and handoff documentation.

Migration completion criterion: every existing visitor-facing fact, link, image, heading, list, contact detail, and stable URL is accounted for in old-to-new content fixtures or review output.

## Tests

### Automated

- Unit tests for Toronto date handling, current/archive/expiry decisions, future-date rejection, anchor generation/collision handling, and every content-block schema.
- Migration fixture tests proving all resource content survives conversion.
- Rendering tests for every block type, callout kind, archived blog, and archived resource section.
- `astro check`, Prettier check, production build, Pagefind indexing, and existing Playwright smoke suite.
- Playwright assertions that archived/expired content is absent from listings/search but its direct route remains and is `noindex`.
- Sitemap assertions excluding archived/expired blog routes.
- Light/dark, keyboard, and narrow/wide public rendering checks for new blocks.
- CMS configuration validation and local/test-backend checks for every collection, required field, hidden field, and typed list.

### Technical rehearsal before cutover

Using real GitHub OAuth and a Netlify deploy preview, technical steward verifies:

1. login and repository authorization;
2. incomplete draft persistence;
3. validation recovery from an intentional error;
4. blog rich text, each insertable component, and future-date rejection;
5. automatic image conversion, file naming, and required description;
6. resource block add/reorder, generated section anchor, and archive notice;
7. direct preview paths for blog, resource, homepage, announcement, team/About, and advanced settings;
8. build-state display and hard merge gates;
9. preview confirmation and self-publish;
10. inactive hidden test-item production publish;
11. correction publish and emergency rollback procedure;
12. scheduled expiry in a controlled date fixture.

Cutover is blocked until all twelve scenarios pass.

### Successor rehearsal after cutover

Provide the successor only in-CMS hints and the quick guide. After guided onboarding, record whether they can independently:

- create and complete a blog draft with image, callout, action link, category, and expiry;
- interpret and fix a validation failure;
- open exact site preview and discard the exercise;
- update and reorder a resource card block;
- prepare an archived resource-section notice without publishing it;
- create an inactive expiring announcement and publish the safe training change;
- add a team member and select the current year;
- identify when to contact the technical steward.

Failures become follow-up usability defects, not undocumented verbal workarounds.

## Documentation

Update together:

- `README.md`
- `AGENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/CONTENT_EDITOR.md`
- `docs/HANDOFF.md`
- `docs/LOCAL_DEVELOPMENT.md`
- `docs/REVIEW_AND_RELEASE.md` or replace it with the new self-publishing flow
- `docs/ROLLBACK.md`
- GitHub pull-request template and relevant issue templates

Add a short noindex browser guide linked from the CMS. It covers login, task areas, draft/save states, validation, exact preview, self-publish, archive/expiry, images, stable URLs, and escalation. Use screenshots from the pinned Sveltia version. Repository docs remain technical-steward reference.

Remove routine references to release webmaster, manual `dev` to `main` releases, Decap, Netlify Identity, Git Gateway, approximate CMS preview, exposed section IDs, and editor-managed image preparation.

## Atomic cutover

Cut over only after automated tests and technical rehearsal pass.

1. Pause content editing.
2. Confirm no open Decap drafts and reconcile all intended `dev` content/code into the cutover branch.
3. Confirm GitHub OAuth app/provider, current editor Write access, and technical steward administration.
4. Merge cutover pull request to `main` after required checks and final deploy-preview review.
5. Verify production routes, `/admin/`, OAuth, one draft preview, and one safe hidden publish.
6. Replace repository default/dependency workflow with `main` and retire `dev` after reconciliation.
7. Remove Decap route/code and decommission Netlify Identity/Git Gateway at cutover. There is no routine-editor legacy fallback.
8. Resume editing and guide successor through onboarding.

If cutover fails, technical steward restores service through GitHub/Netlify using the documented emergency procedure. Restoring Decap requires reverting repository changes and re-enabling its external authentication; it is not kept live as a parallel path.

## Completion criteria

Work is complete when:

- every automated and technical-rehearsal check passes;
- Sveltia at `/admin/` is the only CMS and uses pinned production assets;
- current editor can draft, preview, and self-publish with GitHub Write access only;
- production publishing is impossible while either required check fails;
- all existing content and stable routes/anchors survive migration;
- routine editor sees no raw source, Tailwind, exposed stable ID, Git, or manual image-preparation requirement;
- archived/expired discovery behavior matches this specification;
- `main` is the only long-lived workflow branch and `dev` has been safely retired;
- external OAuth, Netlify, GitHub access, expiry hook, and emergency ownership are recorded in handoff documentation;
- successor usability defects are recorded and prioritized after guided onboarding.
