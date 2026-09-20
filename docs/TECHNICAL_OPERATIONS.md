# Technical operations runbook

Browser-first instructions for controls outside this repository. Technical steward owns these tasks. Content editors use the [content editor guide](CONTENT_EDITOR.md) instead.

Never paste client secrets, build-hook URLs, recovery codes, access tokens, or private account details into GitHub issues, pull requests, rehearsal records, screenshots, or this repository. Keep them in the organization's private credential record. Record owners and where credentials are held, not credential values.

## Initial external setup

Complete in order. Stop when a prerequisite, owner, or expected control is missing.

### 1. Confirm service ownership and access

- [ ] In the private record, name at least two organization owners for GitHub, Netlify, DNS/domain registration, and organizational email.
- [ ] Confirm the technical steward has GitHub repository administration and Netlify project administration.
- [ ] In GitHub, open **Settings → Collaborators and teams** for `UofT-FoM-GRC/Website`. Grant the designated content editor **Write access** only and confirm the invitation was accepted. Do not grant organization-owner or Netlify access for routine editing.
- [ ] Confirm <grc.facmed@utoronto.ca> and all service recovery addresses reach a current owner.

### 2. Register and connect the GitHub OAuth app

Sveltia uses GitHub's authorization-code flow through the Netlify OAuth provider. Netlify Identity is not involved.

- [ ] Prefer an OAuth app owned by the GitHub organization when policy permits. Otherwise name the owning administrator and transfer or replace the app before that person leaves. In the selected account or organization, open **Settings → Developer settings → OAuth Apps → New OAuth App**.
- [ ] Set a recognizable name such as `GRC website CMS`, homepage URL `https://uoftfomgrc.ca`, and **Authorization callback URL** `https://api.netlify.com/auth/done`.
- [ ] Register the GitHub OAuth app. Copy its Client ID and generate one Client Secret.
- [ ] Open the Netlify project, then **Project configuration → Security → OAuth**. Under **Authentication Providers**, select **Install Provider → GitHub**, enter the Client ID and Client Secret, and save.
- [ ] Store the secret only in Netlify and the approved private credential store. Record the OAuth app URL, owner, setup date, and recovery owner without recording the secret.
- [ ] In a private browser window, open <https://uoftfomgrc.ca/admin/>, select GitHub sign-in, authorize the expected app, and confirm the CMS opens `UofT-FoM-GRC/Website`. Sign out after verification.
- [ ] If the GitHub organization restricts third-party OAuth apps or enforces SAML single sign-on, have an organization owner approve the app and have the editor authorize it for the organization; then repeat sign-in.

If the secret is exposed, generate a replacement in GitHub, replace it in Netlify, verify sign-in, then delete the old secret. Removing or transferring the OAuth app can stop all CMS sign-ins.

Primary references: [Sveltia GitHub backend](https://sveltiacms.app/en/docs/backends/github), [Netlify OAuth provider setup](https://docs.netlify.com/manage/security/secure-access-to-sites/oauth-provider-tokens/), and [GitHub OAuth app setup](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app).

### 3. Confirm Netlify deployment controls

- [ ] In **Project configuration → Build & deploy → Continuous deployment**, confirm the linked repository is `UofT-FoM-GRC/Website`, builds are active, and the production branch is `main`.
- [ ] Confirm build command `pnpm run build`, publish directory `dist`, and deploy previews for pull requests are enabled.
- [ ] Open a recent pull request and confirm Netlify reports commit status `netlify/uoft-fom-grc/deploy-preview` with a working preview URL.
- [ ] Confirm the custom domain and HTTPS certificate are healthy. Record the Netlify team owner, project URL, plan, billing contact, and recovery route privately.

### 4. Confirm GitHub repository controls

- [ ] In **Settings → Branches**, set the **default branch** to `main`.
- [ ] In **Settings → General → Pull Requests**, enable squash merging, disable rebase merging, and enable automatic deletion of merged head branches. Do not allow direct routine pushes.
- [ ] Create or inspect the `main` branch protection rule. Require a pull request before merging with zero mandatory approvals; require conversation resolution; block force pushes and branch deletion.
- [ ] Require status checks `Validate` and `netlify/uoft-fom-grc/deploy-preview`. Leave “require branches to be up to date” off so checks are non-strict. If a check is absent from the selector, run it once on a pull request first.
- [ ] Keep administrator bypass available only for documented emergencies. Content editors must have no bypass.
- [ ] Attempt no merge for the test pull request until both checks pass. Confirm a failed or missing check blocks merge.

### 5. Configure scheduled expiry

- [ ] In Netlify, open **Project configuration → Developer settings → Continuous deployment → Build hooks**. Add a hook named `Daily expiry rebuild` for `main`.
- [ ] Copy its URL once. In GitHub, open **Settings → Secrets and variables → Actions → New repository secret** and create `NETLIFY_BUILD_HOOK_URL` containing that URL.
- [ ] Open **Actions → Expiry rebuild → Run workflow**. Confirm the action succeeds and creates a production deploy from `main` in Netlify.
- [ ] Confirm `.github/workflows/expiry-rebuild.yml` remains scheduled for `09:00 UTC`. This occurs after Toronto midnight in both EST and EDT, so content never expires early.
- [ ] Record the hook owner and test date privately. Rotate both hook and secret if its URL is exposed.

The technical steward owns this automation. Check failed scheduled runs and Netlify build usage monthly. It adds about 30 production builds per month; deploy previews and publishes add more. Do not change the Netlify plan without recording cost and migration consequences.

## Atomic cutover and legacy decommissioning

Do not decommission the old path until every scenario in the [technical rehearsal](TECHNICAL_REHEARSAL.md) passes.

- [ ] Announce an editing pause. Record start time and responsible technical steward.
- [ ] Inventory open legacy drafts, open pull requests, and commits present on old `dev` but absent from `main`. Merge intended work through reviewed pull requests or explicitly record why it is discarded. Never delete the branch while unique intended work remains.
- [ ] Confirm OAuth, editor Write access, Netlify deployment settings, `main` protection, required checks, and expiry secret using the setup sections above.
- [ ] Merge the cutover pull request to `main` only after `Validate`, `netlify/uoft-fom-grc/deploy-preview`, and final preview review pass.
- [ ] Run the [production smoke test](REVIEW_AND_RELEASE.md#production-smoke-test), verify `/admin/` OAuth sign-in, create one draft preview, and complete the approved inactive-item publish.
- [ ] Confirm `main` is the GitHub default, Netlify production branch, CI target, and Dependabot target. Remove any Netlify `dev` branch deploy configuration.
- [ ] Delete retired `dev` in GitHub only after reconciliation and production verification. Record its final commit and deletion time.
- [ ] Decommission Decap services: disable Netlify Identity registration, remove legacy users after access is no longer needed, disable Git Gateway, revoke obsolete tokens/invitations, and remove any legacy provider or webhook used only by that path.
- [ ] Verify `/admin/` still runs Sveltia and `/cms/` redirects there. Resume editing and record cutover result.

There is no live Decap fallback after this step. See [full Decap restoration](ROLLBACK.md#full-decap-restoration-last-resort) before claiming the old interface can be restored.

## Routine technical maintenance

### Each month

- [ ] Review failed runs for **Validate** and **Expiry rebuild** in GitHub Actions.
- [ ] Confirm the latest scheduled expiry run caused a successful Netlify production deploy.
- [ ] Review Netlify build usage, deploy failures, domain status, and billing notices.
- [ ] Review current/archived blog state and announcement expiry dates with the content owner.

### Sveltia review each quarter

Review Sveltia CMS quarterly and before annual handoff. Do not float to an unpinned version.

1. Read upstream release notes and security notices since the pinned version. Record the decision to remain or upgrade.
2. For an upgrade, create a short-lived branch from `main`. Change the same exact version in `package.json`, `pnpm-workspace.yaml`, `public/admin/config.yml`, and `public/admin/index.html`; then run `pnpm install` to update `pnpm-lock.yaml`.
3. Update version-specific tests, browser-guide text, and screenshots only when the tested interface changed. Never update tests merely to hide a regression.
4. Run `pnpm format:check`, `pnpm check`, `pnpm build`, and `pnpm test`.
5. Run all twelve [technical rehearsal](TECHNICAL_REHEARSAL.md) scenarios with real GitHub OAuth and the candidate deploy preview. A CMS upgrade does not merge until all scenarios pass.
6. Merge through a pull request after both required checks pass. Verify production sign-in and one disposable draft. Record tested version, release notes, rehearsal record, pull request, and rollback pin.

If an upgrade fails, leave production on the last rehearsed pin. If failure appears after merge, use the [rollback guide](ROLLBACK.md) to revert through a pull request; do not edit the CDN URL directly on `main`.

### Annual access handoff

Complete [ownership and access handoff](HANDOFF.md) with outgoing and incoming technical stewards. Re-run OAuth login, editor access, branch-gate, deploy-preview, expiry-dispatch, rollback, and recovery-contact checks. Remove departed access only after successor access works. Store completed evidence in the organization's private record.

## Related guides

- [Architecture](ARCHITECTURE.md)
- [Local development](LOCAL_DEVELOPMENT.md)
- [Self-publishing and checks](REVIEW_AND_RELEASE.md)
- [Recovery and rollback](ROLLBACK.md)
- [Technical rehearsal](TECHNICAL_REHEARSAL.md)
- [Ownership and access handoff](HANDOFF.md)
