# Ownership and access handoff checklist

Use this checklist before a technical steward changes hands. Store names, recovery codes, tokens, and billing data only in the organization's private record.

## Service ownership

- [ ] Confirm at least two organization owners for GitHub, Netlify, DNS/domain registrar, and email.
- [ ] Confirm Netlify site, production `main`, deploy-preview builds, and the Netlify-linked GitHub OAuth provider used by Sveltia CMS.
- [ ] Confirm GitHub branch protections, required `Validate` and `netlify/uoft-fom-grc/deploy-preview` checks, resolved conversations, and the administrator emergency-bypass policy.
- [ ] Confirm the `NETLIFY_BUILD_HOOK_URL` repository secret for the daily expiry rebuild and rotate it if exposed.
- [ ] Confirm Netlify billing contact, domain renewal contact, and access-recovery route.
- [ ] Confirm the content editor has GitHub repository Write access and no organization or Netlify administration.
- [ ] Confirm public contact email is monitored and has an owner.

## CMS status and content continuity

- [ ] Sveltia CMS `0.214.1` at `/admin/` is the only CMS. It uses GitHub OAuth, editorial workflow, and `main`; `/cms/` redirects to `/admin/`.
- [ ] No Decap, Netlify Identity, or Git Gateway path remains. There is no routine legacy fallback; a CMS failure escalates to the technical steward.
- [ ] Review blog visibility and `expiresOn` dates at least monthly and before term changes. Expiry changes take effect at the next site build; the daily expiry rebuild covers Toronto calendar dates.
- [ ] Archive confirmed-expired promotions; preserve their URLs. Do not mark uncertain facts current.
- [ ] Preserve existing resource slugs, fixed routes, and section anchors. Blog posts are archived, never deleted, through routine controls.

## Technical handoff

- [ ] Run `pnpm format`, `pnpm check`, `pnpm build`, `pnpm test`, `pnpm format:check`, and `pnpm audit --prod` for source changes.
- [ ] Confirm generated `dist`, `.astro`, Pagefind output, and Playwright reports remain untracked.
- [ ] Test `/`, `/blog/`, `/resources/`, `/admin/`, `/cms/` redirect, and a deploy preview after material changes.
- [ ] Record dependency, deployment, and rollback decisions in pull requests or private operations records.
- [ ] Obtain an organization/legal decision before changing `LICENSE`; this repository does not establish one.
