# Content editor guide

Use Decap CMS only. This guide covers blog posts. Other pages, navigation, team roster, and styles need an emergency developer.

## Access

1. Open <https://uoftfomgrc.ca/admin/>.
2. Sign in through Netlify Identity.
3. If access fails, email <grc.facmed@utoronto.ca> with your U of T email and requested role.

This CMS uses Netlify Identity and Git Gateway. Do not use GitHub, Git, or local development for content work.

## Create or correct a post

1. Select **Blog Posts**, then create a post or open an existing post.
2. Complete title, description, publish date, one to three tags, and body. Hero image is optional.
3. Save as a draft. Decap creates a reviewable change targeting `dev`.
4. Notify the release webmaster at <grc.facmed@utoronto.ca>. Include the draft link and requested publishing date.
5. Fix feedback in Decap and save the draft again.
6. Wait for the release webmaster's go-ahead.
7. Publish through Decap to `dev` only after that go-ahead.

Publishing sends content to `dev`, not production. Do not merge the associated GitHub pull request yourself.

## Write safely

- Use a clear title and one- or two-sentence description.
- Use meaningful alternative text for every informational image.
- Use images with permission. Prefer `.webp` or `.jpg`, descriptive filenames, and a 1200 × 630 px hero image.
- Check links, dates, deadlines, names, and contact details before review.
- CMS preview helps drafting; the release webmaster checks the Netlify preview because final styling can differ.

```markdown
## Heading

Short paragraph with a [useful link](https://example.com).

- First item
- Second item

![Description of image](/assets/descriptive-image.webp)
```

## After publication

Edit an incorrect post through Decap and repeat this process. For urgent, harmful, or privacy-sensitive content, email <grc.facmed@utoronto.ca> immediately. See [rollback](ROLLBACK.md).

## Help

- CMS access or publishing problem: <grc.facmed@utoronto.ca>
- Release process: [review and release guide](REVIEW_AND_RELEASE.md)
