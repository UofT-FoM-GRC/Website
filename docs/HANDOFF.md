# Ownership and access handoff checklist

Use this checklist before a technical steward changes hands. Store names, recovery codes, tokens, and billing data only in the organization's private record.

Outgoing and incoming stewards complete this together at least annually. Follow the browser paths in the [technical operations runbook](TECHNICAL_OPERATIONS.md); do not treat checked repository files as proof of external settings.

## Service ownership

- [ ] Confirm at least two organization owners for GitHub, Netlify, DNS/domain registrar, and email.
- [ ] Confirm Netlify site, production `main`, deploy-preview builds, and the Netlify-linked GitHub OAuth provider used by Sveltia CMS.
- [ ] Confirm GitHub branch protections, required `Validate` and `netlify/uoft-fom-grc/deploy-preview` checks, resolved conversations, and the administrator emergency-bypass policy.
- [ ] Confirm the `NETLIFY_BUILD_HOOK_URL` repository secret for the daily expiry rebuild and rotate it if exposed.
- [ ] Confirm Netlify billing contact, domain renewal contact, and access-recovery route.
- [ ] Confirm the content editor has GitHub repository Write access and no organization or Netlify administration.
- [ ] Confirm public contact email is monitored and has an owner.
- [ ] Incoming steward successfully signs into GitHub and Netlify with administration; only then remove departed access.
- [ ] Confirm GitHub OAuth app owner, application URL, callback URL, secret-storage location, and rotation route without copying the secret into this checklist.

## CMS status and content continuity

- [ ] Sveltia CMS `0.214.1` at `/admin/` is the only CMS. It uses GitHub OAuth, editorial workflow, and `main`; `/cms/` redirects to `/admin/`.
- [ ] No Decap, Netlify Identity, or Git Gateway path remains. There is no routine legacy fallback; a CMS failure escalates to the technical steward.
- [ ] Review blog visibility and `expiresOn` dates at least monthly and before term changes. Expiry changes take effect at the next site build; the daily expiry rebuild covers Toronto calendar dates.
- [ ] Review Sveltia release notes and the pinned version quarterly and before this handoff. Version changes require the complete [technical rehearsal](TECHNICAL_REHEARSAL.md).
- [ ] Archive confirmed-expired promotions; preserve their URLs. Do not mark uncertain facts current.
- [ ] Preserve existing resource slugs, fixed routes, and section anchors. Blog posts are archived, never deleted, through routine controls.

## Technical handoff

- [ ] Run `pnpm format`, `pnpm check`, `pnpm build`, `pnpm test`, `pnpm format:check`, and `pnpm audit --prod` for source changes.
- [ ] Confirm generated `dist`, `.astro`, Pagefind output, and Playwright reports remain untracked.
- [ ] Test `/`, `/blog/`, `/resources/`, `/admin/`, `/cms/` redirect, and a deploy preview after material changes.
- [ ] Dispatch **Expiry rebuild**, confirm its Netlify production deploy, and review monthly build usage and failed scheduled runs.
- [ ] Walk through correction publishing, temporary Netlify restore, repository reconciliation, and the fact that Decap restoration is not a live fallback.
- [ ] Confirm a current private copy of the twelve-scenario rehearsal record, last upgrade decision, last recovery exercise, and external service inventory.
- [ ] Record dependency, deployment, and rollback decisions in pull requests or private operations records.
- [ ] Obtain an organization/legal decision before changing `LICENSE`; this repository does not establish one.
