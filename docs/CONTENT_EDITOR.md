# Content editor guide

Use this guide for blog posts. Other pages, navigation, team roster, and styles require a developer change.

## Access

1. Open <https://uoftfomgrc.ca/admin/>.
2. Sign in through Netlify Identity.
3. If access fails, email <grc.facmed@utoronto.ca> with your U of T email and requested role.

This CMS is configured with Netlify Identity and Git Gateway. GitHub collaborator access alone does not sign you in. GitHub sign-in works only when a Netlify Identity administrator has deliberately configured GitHub as an identity provider.

## Create or correct a post

1. Select **Blog Posts**, then create a post or open an existing post.
2. Complete title, description, publish date, one to three tags, and body. Hero image is optional.
3. Save as a draft. Decap creates a reviewable change targeting `dev`.
4. Send reviewer link and deadline to <grc.facmed@utoronto.ca>.
5. Make requested changes in CMS and save again.
6. Only after reviewer approval, mark ready and publish to `dev`.

Publishing in Decap moves the editorial change to `dev`; it does not independently prove reviewer approval. Do not publish without recorded approval.

## Write safely

- Use a clear title and one- or two-sentence description.
- Use meaningful alternative text for every informational image.
- Use images with permission. Prefer `.webp` or `.jpg`, descriptive filenames, and a 1200 × 630 px hero image.
- Check links, dates, deadlines, names, and contact details before review.
- CMS preview helps drafting; reviewer should check Netlify Deploy Preview when available because final styling may differ.

```markdown
## Heading

Short paragraph with a [useful link](https://example.com).

- First item
- Second item

![Description of image](/assets/descriptive-image.webp)
```

## After publication

Edit an incorrect post through CMS and repeat review. For urgent, harmful, or privacy-sensitive content, email <grc.facmed@utoronto.ca> immediately; do not wait for normal release timing. See [rollback](ROLLBACK.md) for release responders.

## Help

- CMS access or publishing problem: <grc.facmed@utoronto.ca>
- Public content correction: use [content correction issue](https://github.com/UofT-FoM-GRC/Website/issues/new/choose) when no sensitive information is involved.
- Release process: [review and release guide](REVIEW_AND_RELEASE.md)
