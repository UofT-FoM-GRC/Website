# Rollback guide

Use rollback for wrong, harmful, unavailable, or privacy-sensitive production content. Preserve production URL, release pull request, deployment URL, time, screenshots, and browser errors.

## First response

1. Release webmaster stops new releases and records impact, urgency, affected pages, and release pull request.
2. Use routine Netlify restore or GitHub revert below when clear and available.
3. Escalate to emergency developer when access, checks, conflicts, source state, or scope is unclear.
4. Complete [production smoke test](REVIEW_AND_RELEASE.md#production-smoke-test) after recovery.

## Routine Netlify restore

Release webmaster uses Netlify browser deploy history to locate a known-good production deploy. Use **Publish deploy** or equivalent restore action as temporary mitigation when available. Record deploy ID, time, reason, and result in the release or incident discussion.

Netlify restore does not repair Git source, and the next Git-triggered production deploy will overwrite it. Follow with the GitHub reconciliation below before the next release.

## Routine GitHub revert

For a clear failed release, release webmaster uses GitHub's **Revert** action on the failed release pull request to create a revert pull request targeting `main`. Self-review it; confirm `Validate` and `netlify/uoft-fom-grc/deploy-preview`; then merge with **Create a merge commit**. Never force-push or rewrite history.

Keep releases paused until the emergency developer confirms that `dev` is reconciled. For CMS-only content, a content editor makes the equivalent correction through Decap after webmaster review; the emergency developer verifies branch state. For code, configuration, mixed releases, or any conflict, the emergency developer makes the corrective change. Without this work, the next `dev` to `main` release can restore the failed change.

## Emergency boundary

Emergency developer handles Git or Netlify access recovery, local code/configuration/dependency fixes, conflicts, broken checks, and complex rollback. Administrators retain GitHub bypass ability for emergencies. Use it only when the protected workflow cannot safely recover service; record reason, actor, affected refs or deploys, failed or skipped checks, time, and recovery action, then reconcile `dev` with `main`. Never force-push or rewrite shared history.

Do not guess at conflict resolution or bypass a protection during routine operation. Escalate with collected evidence.

## Confirm recovery

- Netlify production deploy reports success.
- Smoke test passes on custom domain.
- Changed content is absent or corrected.
- `main` and `dev` are reconciled and documented.
- Release webmaster records rollback method and follow-up work.
