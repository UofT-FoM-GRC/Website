# Handoff checklist

Complete private ownership records outside repository. Never store passwords, recovery codes, API keys, or tokens here.

## Private ownership record

Fill each field with role, backup role, secure-record location, and verification date.

- [ ] GitHub organization owner: `________________`
- [ ] Backup GitHub organization owner: `________________`
- [ ] GitHub release approver: `________________`
- [ ] Netlify team and project owner: `________________`
- [ ] Backup Netlify administrator: `________________`
- [ ] Netlify Identity and Git Gateway administrator: `________________`
- [ ] Domain registrar owner and renewal contact: `________________`
- [ ] DNS owner: `________________`
- [ ] Billing and usage-alert owner: `________________`
- [ ] Emergency deploy/rollback owner: `________________`
- [ ] Approved private credential-record location: `________________`

## Access and settings

- [ ] At least two current people can administer GitHub organization and repository.
- [ ] At least two current people can access Netlify project, deploy history, Identity, and Git Gateway.
- [ ] Confirm Netlify production branch, build command, publish directory, deploy-preview behavior, and current plan/billing model.
- [ ] Confirm domain registration, DNS, renewal date, payment owner, SSL, and outage notifications.
- [ ] Verify `main` protection/ruleset: pull requests, approval, `CI / Validate`, force-push block, deletion block, and administrator policy.
- [ ] Test any `dev` protection with a disposable CMS post before retaining it. Git Gateway editorial publication must still work.
- [ ] Review GitHub collaborators, Netlify users, and Identity users; remove obsolete access only after successors verify access.

## Operating rehearsal

- [ ] New content editor signs in through Netlify Identity and creates disposable draft.
- [ ] Reviewer confirms CI and Deploy Preview, when available, then records approval.
- [ ] Editor publishes disposable draft to `dev`.
- [ ] Releaser creates `dev` to `main` pull request in GitHub UI and completes [production smoke test](REVIEW_AND_RELEASE.md#production-smoke-test).
- [ ] Team rehearses [rollback](ROLLBACK.md) and removes disposable content through normal workflow.
- [ ] Incoming developer completes fresh clone steps and `pnpm check` plus `pnpm build`.

## Annual review

- [ ] Verify team roster, contact information, resources, homepage claims, links, and expired posts.
- [ ] Confirm image consent and retention expectations.
- [ ] Review dependency updates and major-update manual review requirement.
- [ ] Reconfirm ownership record and durable support email: <grc.facmed@utoronto.ca>.

Questions, missing ownership, or access loss: email <grc.facmed@utoronto.ca>. Do not assume private roles, Netlify account details, or billing facts from this repository.
