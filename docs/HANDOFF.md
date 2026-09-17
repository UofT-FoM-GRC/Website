# Ownership and access handoff checklist

Use this checklist before a webmaster or emergency developer changes hands. Store names, recovery codes, tokens, and billing data only in the organization's private record.

## Release and service ownership

- [ ] Confirm at least two organization owners for GitHub, Netlify, DNS/domain registrar, and email.
- [ ] Confirm Netlify site, production `main`, branch `dev`, and deploy-preview ownership.
- [ ] Confirm GitHub branch protections, required `Validate` and Netlify checks, and administrator emergency-bypass policy.
- [ ] Confirm Netlify billing contact, domain renewal contact, and access-recovery route.
- [ ] Confirm public contact email is monitored and has an owner.

## CMS status and content continuity

- [ ] Decap at `/admin/` remains current CMS: Netlify Identity + Git Gateway, editorial workflow, target branch `dev`.
- [ ] Sveltia at `/cms/` remains staged only. Follow [architecture](ARCHITECTURE.md#cms-routes-and-cutover-state) before cutover; Git Gateway and Netlify Identity are unsupported there.
- [ ] Review blog `reviewBy`, `expiresOn`, `status`, and `contentOwner` fields at least monthly and before term changes. Expiry changes take effect only after a site build; publish or schedule a build for the first day after an expiry date.
- [ ] Archive confirmed-expired promotions; preserve their URLs. Do not mark uncertain facts current.
- [ ] Preserve existing resource slugs and section IDs. Decap cannot lock IDs in dynamic section lists; schema validation only catches malformed or duplicate IDs.

## Technical handoff

- [ ] Run `pnpm format`, `pnpm check`, `pnpm build`, `pnpm test`, `pnpm format:check`, and `pnpm audit --prod` for source changes.
- [ ] Confirm generated `dist`, `.astro`, Pagefind output, and Playwright reports remain untracked.
- [ ] Test `/`, `/blog/`, `/resources/`, `/admin/`, and a deploy preview after material changes.
- [ ] Record dependency, deployment, and rollback decisions in pull requests or private operations records.
- [ ] Obtain an organization/legal decision before changing `LICENSE`; this repository does not establish one.
