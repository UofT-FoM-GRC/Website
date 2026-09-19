# Rollback guide

Use rollback for wrong, harmful, unavailable, or privacy-sensitive production content. Preserve the production URL, published pull request or CMS draft, deployment URL, time, screenshots, and browser errors.

## First response

1. Pause further publishing and record impact, urgency, affected pages, and the published pull request.
2. Use the routine Netlify restore or GitHub revert below when clear and available.
3. Escalate to the technical steward when access, checks, conflicts, source state, or scope is unclear.
4. Complete the [production smoke test](REVIEW_AND_RELEASE.md#production-smoke-test) after recovery.

## Correction publish

For CMS-only blog, resource, homepage, announcement, navigation, site-setting, or team content, a content editor may make the correction through Sveltia, review the exact route in the deploy preview, and publish after both required checks pass. Use this when the current source is structurally sound and a normal correction is fast enough.

Do not use a correction publish when private or dangerous content must disappear before checks and a production deploy can finish. Use the hosting rollback below, then reconcile the repository.

## Hosting rollback with Netlify

The technical steward uses Netlify browser deploy history to locate a known-good production deploy. Compare its commit, date, and preview before selecting **Publish deploy** or the equivalent restore action. Record old and restored deploy IDs, commits, time, actor, reason, and result in the incident discussion.

Netlify restore is temporary mitigation. It does not repair Git source, and the next Git-triggered production deploy will overwrite it. Follow with repository reconciliation.

## Repository reconciliation

1. Record the commit used by the restored Netlify deploy and the current `main` commit. Identify every source commit after the known-good state; do not assume the newest commit alone caused the incident.
2. Choose either a CMS correction publish for valid content-only source or a GitHub revert pull request for a clear bad squash commit. For code, configuration, multiple commits, or conflicts, use a short-lived recovery branch from `main` and make the smallest explicit correction.
3. For a clear failed publish, a technical steward uses GitHub's **Revert** action on the squash commit. GitHub opens a revert pull request targeting `main`. Review the resulting diff; do not blindly revert unrelated later work.
4. Confirm `Validate` and `netlify/uoft-fom-grc/deploy-preview`, review the exact preview, resolve conversations, then use **Squash and merge**. Never force-push or rewrite history.
5. Let reconciled `main` create a fresh Netlify production deploy. Confirm production now corresponds to the recorded `main` commit; do not leave a manually restored deploy as the permanent state.

If GitHub or Netlify is unavailable, preserve evidence and wait or use the administrator emergency boundary below. A hosting restore without source reconciliation is incomplete recovery.

## Emergency boundary

The technical steward handles Git or Netlify access recovery, local code/configuration/dependency fixes, conflicts, broken checks, and complex rollback. Administrators retain GitHub bypass ability for emergencies. Use it only when the protected workflow cannot safely recover service; record reason, actor, affected refs or deploys, failed or skipped checks, time, and recovery action. Never force-push or rewrite shared history.

Do not guess at conflict resolution or bypass a protection during routine operation. Escalate with collected evidence.

## Full Decap restoration (last resort)

Decap is not a live fallback. Netlify Identity and Git Gateway are decommissioned after cutover, and no tested parallel editing path remains. Restoring Decap is an emergency migration, not a login-page switch.

Only consider it when Sveltia cannot be repaired or rolled back to the last rehearsed pin and organizational leadership accepts the old workflow's risks. The technical steward must complete all of these requirements on a recovery branch and record each external change:

1. Identify the last known-good Decap repository commit and compare its content model with current `main`. Plan forward migration of current content; never reset `main`, discard post-cutover content, or recreate `dev` from stale state.
2. Restore compatible Decap application assets, configuration, backend settings, schemas, content shapes, and routes through a reviewed pull request. Reintroducing only the old `/admin/` files is insufficient.
3. In Netlify, re-enable Netlify Identity, keep registration invite-only, restore an approved owner and recovery path, and invite the minimum editor accounts.
4. Re-enable Git Gateway, reconnect it to the correct GitHub repository and branch, and verify its service authorization. Rotate any newly exposed credential.
5. Define and protect the restored publishing branch before use. Do not assume deleted `dev`, old CI triggers, old deploy settings, or old drafts still exist or are safe to recover.
6. Restore compatible validation, deploy-preview, merge, and production deployment behavior. Exercise sign-in, draft, preview, publish, correction, and rollback with a safe test item.
7. Update architecture, editor, release, handoff, and recovery documentation before editors resume work. Announce that this is a replacement workflow, not concurrent fallback access.

If any repository, authentication, authorization, validation, or deployment layer is missing, Decap restoration is incomplete and must not be offered to editors.

## Confirm recovery

- Netlify production deploy reports success.
- Production deploy commit matches reconciled `main`.
- Smoke test passes on the custom domain.
- Changed content is absent or corrected.
- The revert or correction is recorded with its pull request.
- The technical steward records the rollback method and follow-up work.

External setup and access recovery: [technical operations runbook](TECHNICAL_OPERATIONS.md).
