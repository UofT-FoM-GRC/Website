# CMS technical rehearsal record

Copy this file into the approved private operations record for each rehearsal. Do not enter secrets, tokens, recovery codes, private user data, or unredacted authentication screenshots. Cutover and Sveltia upgrades are blocked until all twelve scenarios pass with real GitHub OAuth and a Netlify deploy preview.

## Run details

| Field                             | Record |
| --------------------------------- | ------ |
| Date and Toronto time             |        |
| Technical steward                 |        |
| Content-editor test account       |        |
| Candidate Sveltia version         |        |
| Candidate branch and pull request |        |
| Candidate commit                  |        |
| Netlify deploy-preview URL        |        |
| Production baseline deploy        |        |
| Browser and operating system      |        |
| Editing pause approved by         |        |

Use **Pass**, **Fail**, or **Blocked** for each result. Evidence may be a pull request, check run, deploy ID, redacted screenshot, or timestamped observation. Record follow-up defects; never substitute a verbal workaround for a failed scenario.

## Scenario 01: Login and repository authorization

1. Open the candidate `/admin/` route in a private browser window.
2. Sign in through the configured GitHub OAuth app with the editor test account.
3. Confirm the consent screen names the expected app and the CMS opens `UofT-FoM-GRC/Website`.

**Pass when:** the authorized editor reaches the expected repository and task areas through OAuth without token sign-in. A second sacrificial GitHub account is not required; GitHub remains the authority for repository Write access.

**Result:** ☐ Pass ☐ Fail ☐ Blocked

**Evidence:**

**Notes or defect:**

## Scenario 02: Incomplete draft persistence

1. Start a disposable blog draft with a recognizable rehearsal title.
2. Leave at least one required field empty and save without publishing.
3. Sign out or close the browser, sign in again, and reopen the draft.
4. Confirm entered values remain and production is unchanged.

**Pass when:** incomplete draft survives a new session, missing fields remain identified, and no public route changes.

**Result:** ☐ Pass ☐ Fail ☐ Blocked

**Evidence:**

**Notes or defect:**

## Scenario 03: Validation recovery

1. In the disposable draft, enter one intentional validation error, such as a missing image description or invalid destination.
2. Save and record the field-specific message or failed `Validate` result.
3. Correct the value and save again.
4. Confirm validation passes on the same draft pull request.

**Pass when:** the error blocks readiness or publishing, identifies the affected field, and clears after correction without losing draft work.

**Result:** ☐ Pass ☐ Fail ☐ Blocked

**Evidence:**

**Notes or defect:**

## Scenario 04: Blog rich text, components, and future-date rejection

1. Add headings, emphasis, a link, bulleted and numbered lists, an image, all three callout kinds, and an action link.
2. Confirm raw source, code blocks, heading one, arbitrary color, and layout controls are absent.
3. Set Publication Date to tomorrow in Toronto and confirm rejection; restore today's or an earlier date.
4. Save and inspect the exact blog route in the deploy preview.

**Pass when:** blog rich text and every insertable component render correctly, controls remain curated, and a future date cannot pass validation.

**Result:** ☐ Pass ☐ Fail ☐ Blocked

**Evidence:**

**Notes or defect:**

## Scenario 05: Automatic image conversion and description

1. Upload representative JPEG or PNG media with a mixed-case or spaced file name.
2. Confirm output is slugified WebP under `public/assets/`, no larger than 2048 × 2048, without upscaling or aspect-ratio change.
3. Remove its image description and confirm validation blocks the draft; restore a meaningful description.
4. Check image rendering and alternative text in the deploy preview.

**Pass when:** image conversion, naming, size, and required-description behavior match the media contract without manual preparation.

**Result:** ☐ Pass ☐ Fail ☐ Blocked

**Evidence:**

**Notes or defect:**

## Scenario 06: Resource blocks, anchor generation, and archive notice

1. In a disposable resource change, add each allowed resource block and reorder at least two blocks.
2. Add a temporary section and confirm its stable anchor is generated, readable, and unique without exposing an anchor field.
3. Rename its heading and confirm the generated anchor does not change.
4. Archive the temporary section without a notice, confirm rejection, then add a notice and optional replacement link.

**Pass when:** resource blocks add/reorder correctly, generated section anchor remains stable, and archive notice is mandatory and renders at the direct anchor.

**Result:** ☐ Pass ☐ Fail ☐ Blocked

**Evidence:**

**Notes or defect:**

## Scenario 07: Direct preview paths for every task area

Save a disposable change in each area and open **View Preview**: blog route, selected resource route, homepage announcement at `/`, homepage at `/`, Team and About at `/about/`, navigation at `/`, and contact/social settings at `/`.

**Pass when:** every direct preview path opens the changed route on the same pull request's Netlify deploy preview, never production or a generic editor preview.

**Result:** ☐ Pass ☐ Fail ☐ Blocked

**Evidence:**

**Notes or defect:**

## Scenario 08: Build state and hard merge gates

1. Observe the CMS while `Validate` and `netlify/uoft-fom-grc/deploy-preview` are pending and successful. To produce a failed state, the technical steward adds one small, reversible invalid fixture to the rehearsal draft branch; never damage `main` or bypass a gate.
2. Confirm the visible build state follows the pull request status.
3. Attempt publishing while each required check is failed or missing and while a conversation is unresolved.
4. Resolve the test condition and rerun checks.

**Pass when:** build-state display is accurate and hard merge gates prevent routine publishing until both named checks pass and conversations are resolved.

**Result:** ☐ Pass ☐ Fail ☐ Blocked

**Evidence:**

**Notes or defect:**

## Scenario 09: Preview confirmation and self-publish

1. Use an approved disposable or inactive change whose production effect is safe.
2. With checks passing, cancel “I reviewed the site preview.” and confirm no merge occurs.
3. Review the exact preview, retry, accept the confirmation, and publish.
4. Confirm Sveltia squash-merges into `main`, deletes the draft branch, and Netlify deploys production.

**Pass when:** cancellation aborts, confirmation permits self-publish, one squash commit reaches `main`, and production matches the reviewed preview.

**Result:** ☐ Pass ☐ Fail ☐ Blocked

**Evidence:**

**Notes or defect:**

## Scenario 10: Inactive hidden test-item production publish

1. Create or update the designated training announcement with **Show on Homepage** disabled.
2. Review its homepage deploy preview and publish through the normal gates.
3. Verify the record exists on `main` but no announcement appears publicly, in search, RSS, or sitemap output.

**Pass when:** the inactive hidden test item completes the production publish path without visitor-facing clutter.

**Result:** ☐ Pass ☐ Fail ☐ Blocked

**Evidence:**

**Notes or defect:**

## Scenario 11: Correction publish and emergency rollback

Use only the inactive training item, in a window where the previous deploy differs from current production only by that hidden item; do not manufacture harmful public content or roll back unrelated changes.

1. Publish a safe correction through the CMS and verify production.
2. Record current `main` commit and production deploy. In Netlify deploy history, temporarily publish the previous known-good deploy.
3. Confirm the hosting rollback changes production but does not change `main`.
4. Reconcile the repository using a CMS correction or GitHub revert pull request as appropriate, pass both checks, deploy from reconciled `main`, and complete the production smoke test.

**Pass when:** correction publishing works, hosting restore mitigates immediately, repository reconciliation prevents the next deploy from reintroducing the incident, and all actions are recorded.

**Result:** ☐ Pass ☐ Fail ☐ Blocked

**Evidence:**

**Notes or defect:**

## Scenario 12: Scheduled expiry with a controlled date fixture

Schedule this scenario in an approved window. Use a clearly labelled temporary announcement; never change a production host clock.

1. Publish an active test announcement with expiry equal to today's Toronto date. Verify it remains visible through that date.
2. After Toronto midnight, wait for the next `09:00 UTC` **Expiry rebuild** scheduled run. Do not manually publish another content change first.
3. Confirm the action calls the Netlify build hook, Netlify builds current `main`, and the announcement disappears from the homepage after the build.
4. Confirm source content was not edited or committed by the workflow. Remove the temporary record through a normal correction publish.

If GitHub skips the first newly registered schedule, record the missing event. A `workflow_dispatch` run may verify the hook, rebuild, expiry, and source-immutability path, but it does not replace scheduled-event evidence; verify the first real scheduled run after cutover as an explicit follow-up.

**Pass when:** scheduled expiry occurs only after the selected Toronto date, workflow and deploy evidence exist, no draft is published, and no source commit is created by automation. A manual fallback leaves scheduled-event verification open until the first real cron run succeeds.

**Result:** ☐ Pass ☐ Fail ☐ Blocked

**Evidence:**

**Notes or defect:**

## Decision

- [ ] All twelve scenarios passed.
- [ ] Failed or blocked scenarios have linked defects and cutover/upgrade remains blocked.
- [ ] Disposable drafts and temporary production records were removed or archived safely.
- [ ] No evidence contains credentials or private user data.

**Decision:** ☐ Proceed ☐ Do not proceed

**Technical steward sign-off and time:**

**Follow-up defects:**

Setup and ownership steps: [technical operations runbook](TECHNICAL_OPERATIONS.md). Incident procedure: [rollback guide](ROLLBACK.md).
