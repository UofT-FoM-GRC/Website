# Rollback guide

Use rollback for wrong, harmful, unavailable, or privacy-sensitive production content. Preserve evidence: production URL, release pull request, deployment URL, time, screenshots, and browser error.

## First response

1. Stop new releases and notify <grc.facmed@utoronto.ca>.
2. State impact and urgency. Include affected pages and release pull request.
3. Choose source-controlled rollback or temporary Netlify deployment restore below.
4. Complete [production smoke test](REVIEW_AND_RELEASE.md#production-smoke-test) after recovery.

## Preferred: source-controlled rollback

Use GitHub UI. Create correction or revert pull request targeting `dev`, review it, then release `dev` to `main` through normal process.

If urgent production recovery needs a direct revert pull request to `main`, an authorized releaser may use GitHub's **Revert** action on failed release pull request. Then immediately create equivalent corrective change for `dev`; otherwise future `dev` to `main` release can reintroduce problem. Never force-push or rewrite `main` history.

If revert conflicts, protection blocks action, or affected change is unclear, stop and email <grc.facmed@utoronto.ca>. Include links and do not guess at conflict resolution.

## Temporary Netlify restore

Only Netlify administrator should do this. In Netlify deploy history, locate known-good production deploy. If dashboard provides a **Publish deploy** or equivalent restore action and current project permissions allow it, publish that deploy as temporary mitigation.

This action is settings-dependent and does not repair Git source. Follow with source-controlled rollback so `main`, `dev`, and later deploys remain correct. Record deploy ID, actor, time, and reason in incident/release discussion.

If deploy history, restore control, or access is unavailable, email <grc.facmed@utoronto.ca>. Ownership fields belong in [handoff checklist](HANDOFF_CHECKLIST.md), not this repository.

## Confirm recovery

- Netlify production deploy reports success.
- Smoke test passes on custom domain.
- Changed content is absent or corrected.
- `main` and `dev` corrective work is documented.
- Reviewer records incident, rollback method, and follow-up work.
