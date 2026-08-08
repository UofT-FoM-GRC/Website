# Content editor guide

## Current CMS: Decap at `/admin/`

Use <https://uoftfomgrc.ca/admin/>. Sign in with Netlify Identity. This route uses Git Gateway and publishes approved changes to `dev`; no GitHub, Git, or local tools needed.

Sveltia is staged at `/cms/` but unavailable until OAuth cutover. Do not use it yet.

## Edit content

1. Open a collection. **Blog Posts** creates and edits posts. **Resource Pages** edits the eight existing pages. **Site Settings** contains homepage, announcements, navigation, contact/social links, and about/team archive.
2. Use labels, hints, lists, and image controls. Do not repurpose existing resource section IDs. Reorder lists with drag handles.
3. Add meaningful alternative text for every informational image. Leave decorative-image text empty only when image adds no information.
4. Save a draft. Review exact changed fields and links.
5. Notify release webmaster at <grc.facmed@utoronto.ca>. Include draft link and requested publishing date.
6. Fix feedback. Publish to `dev` only after go-ahead.

Publishing never changes production. Authoritative preview is Netlify `dev` branch deploy, not CMS pane.

## Guardrails

- Blog post URL comes from file slug. Changing existing title does not change it. Use one to three tags; tags control related resource posts.
- **Updated Date** belongs on materially corrected published posts. Hero image alternative text is required when image conveys information.
- Resource page URL IDs are protected. Existing section IDs are public links: do not change or repurpose them. Add new sections/cards instead.
- Team years and members display in listed order. Add photo and photo alternative text together. Missing photo shows standard avatar.
- Homepage hero needs two to five lines. The second line is the page heading; keep it descriptive.
- Homepage announcements display only when **Show on Homepage** is enabled; list order controls display order.
- External links need `https://`; email needs `mailto:`; phone needs `tel:`.
- CMS preview is approximate field-level preview. Netlify render is final Astro/Tailwind output.

## Image workflow

Upload images through image field. CMS writes under `public/assets/`; pages use `/assets/...`. Prefer approved `.webp` or `.jpg`, descriptive filenames, and 1200 × 630 px hero images.

Legacy images already visible on site remain available to build. For replacement, upload new image rather than editing legacy path.

## Help and recovery

- CMS access/publishing: <grc.facmed@utoronto.ca>
- Review/release: [review and release](REVIEW_AND_RELEASE.md)
- Harmful, private, or urgent content: stop publishing and follow [rollback](ROLLBACK.md).
