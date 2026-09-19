# Content editor guide

## CMS: Sveltia at `/admin/`

Use <https://uoftfomgrc.ca/admin/>. Sign in with GitHub. Sveltia saves drafts on short-lived branches and opens pull requests against `main`; you publish your own reviewed drafts. No Git commands, branches, pull requests, or local tools are needed, and no second person has to approve.

## Edit content

1. Open a task area: **Blog Posts**, **Resource Pages**, **Homepage Announcements**, **Homepage**, **Team and About Page**, or **Advanced Site Settings**. **Blog Posts** creates and edits posts; **Resource Pages** edits the eight existing pages.
2. Use labels, hints, lists, and image controls. Add meaningful image descriptions. Reorder lists with drag handles.
3. Save. Incomplete drafts are allowed: missing required fields and invalid values are marked in the editor, and you can fix them later. A valid save creates or updates one draft pull request that can be revisited across sessions.
4. When nothing is flagged, open **View Preview**. It points at the exact changed route in the Netlify deploy preview. Wait for **Building…** to finish; **Build Failed** means the preview needs a fix.
5. Review the page: text, links, images and descriptions, dates, and other changed details.
6. When `Validate` and `netlify/uoft-fom-grc/deploy-preview` pass and all comments are resolved, move the draft to **Ready** and publish. Confirm "I reviewed the site preview." when asked.
7. Sveltia merges the draft into `main` and Netlify deploys production. If publishing fails, the draft stays unpublished; fix what the CMS reports and publish again.

The in-editor split preview is disabled. **View Preview** is the only authoritative preview. Saving a draft never changes the public site.

## Advanced Site Settings

**Advanced Site Settings** affects every page. It holds the header brand and navigation links, the resource menu, and the contact email plus social links used in the header, footer, and homepage contact section. In URL fields use `https://` for external pages, `/about` for a page on this site, `mailto:grc.facmed@utoronto.ca` for email, `tel:+14161234567` for telephone, or `#contact` for a section of the current page. The resource menu has one entry per fixed resource page; choose the page from the list instead of typing a route, and drag entries to set menu order.

## Guardrails

- Blog post URL comes from the file name, not the title. Archived posts remain reachable at their existing URL; deleted posts lose it permanently, so archiving is the routine choice.
- **Updated Date** is set automatically whenever an existing blog post is saved with changes.
- Resource page URLs are protected. Existing section anchors are public links: do not change or repurpose them. Add new sections or cards instead.
- Team years and members display in listed order; drag to reorder. **Current Team Year** must exactly match one listed **Academic Year** text, or the site build fails and publishing is blocked. Add photo and photo description together. Missing photo shows the standard avatar.
- Homepage hero needs two to five lines. The second line is the page heading; keep it descriptive.
- Homepage announcements display only when **Show on Homepage** is enabled; list order controls display order. An active announcement requires an expiry date and stays up through that Toronto date, then hides at the next scheduled daily rebuild. Leave an announcement inactive to keep it as an unpublished training item.
- Blog posts and active announcements expire automatically on their Toronto calendar date. Expired or archived content stays at its URL with a historical notice, leaves listings and search, and is marked `noindex`.
- External links need `https://`; email needs `mailto:`; phone needs `tel:`.

## Image workflow

Upload images through an image field. The CMS converts JPEG, PNG, and WebP uploads to optimized WebP under `public/assets/`, limits them to 2048 × 2048 without upscaling, and requires an image description for every supplied image. Prefer descriptive file names; uploads are slugified.

Legacy images already visible on the site remain available to the build. For a replacement, upload a new image rather than editing a legacy path.

## Help and recovery

- Access, publishing, or content questions: <grc.facmed@utoronto.ca>
- Publishing checks and merge gates: [self-publishing and checks guide](REVIEW_AND_RELEASE.md)
- Harmful, private, or urgent content: stop publishing and follow [rollback](ROLLBACK.md).
