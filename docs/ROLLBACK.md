# Rollback guide

Use rollback for wrong, harmful, unavailable, or privacy-sensitive production content. Preserve the production URL, published pull request or CMS draft, deployment URL, time, screenshots, and browser errors.

## First response

1. Pause further publishing and record impact, urgency, affected pages, and the published pull request.
2. Use the routine Netlify restore or GitHub revert below when clear and available.
3. Escalate to the technical steward when access, checks, conflicts, source state, or scope is unclear.
4. Complete the [production smoke test](REVIEW_AND_RELEASE.md#production-smoke-test) after recovery.

## Routine Netlify restore

The technical steward uses Netlify browser deploy history to locate a known-good production deploy. Use **Publish deploy** or the equivalent restore action as temporary mitigation when available. Record deploy ID, time, reason, and result in the incident discussion.

Netlify restore does not repair Git source, and the next Git-triggered production deploy will overwrite it. Follow with the GitHub revert below.

## Routine GitHub revert

For a clear failed publish, a technical steward uses GitHub's **Revert** action on the squash commit created by the published CMS pull request. GitHub opens a revert pull request targeting `main`. Self-review it; confirm `Validate` and `netlify/uoft-fom-grc/deploy-preview`; then merge with **Squash and merge**. Never force-push or rewrite history.

For CMS-only blog, resource, homepage, navigation, site-setting, or team content, a content editor may instead make the equivalent correction through the CMS, review the exact route in the deploy preview, and publish it.

## Emergency boundary

The technical steward handles Git or Netlify access recovery, local code/configuration/dependency fixes, conflicts, broken checks, and complex rollback. Administrators retain GitHub bypass ability for emergencies. Use it only when the protected workflow cannot safely recover service; record reason, actor, affected refs or deploys, failed or skipped checks, time, and recovery action. Never force-push or rewrite shared history.

Do not guess at conflict resolution or bypass a protection during routine operation. Escalate with collected evidence.

## Confirm recovery

- Netlify production deploy reports success.
- Smoke test passes on the custom domain.
- Changed content is absent or corrected.
- The revert or correction is recorded with its pull request.
- The technical steward records the rollback method and follow-up work.
