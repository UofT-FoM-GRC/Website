# Content editor guide

## CMS: Sveltia at `/admin/`

Use <https://uoftfomgrc.ca/admin/>. Sign in with GitHub. Sveltia saves drafts on short-lived branches and opens pull requests against `main`; you publish your own reviewed drafts. No Git commands, branches, pull requests, or local tools are needed, and no second person has to approve.

## Edit content

1. Open a task area: **Blog Posts**, **Resource Pages**, **Homepage Announcements**, **Homepage**, **Team and About Page**, **Resources, Blog and Contact Pages**, or **Advanced Site Settings**. **Blog Posts** creates and edits posts; **Resource Pages** edits the eight existing pages.
2. Use labels, hints, lists, and image controls. Add meaningful image descriptions. Reorder lists with drag handles.
3. Save. Incomplete drafts are allowed: missing required fields and invalid values are marked in the editor, and you can fix them later. A valid save creates or updates one draft pull request that can be revisited across sessions.
4. When nothing is flagged, open **View Preview**. It points at the exact changed route in the Netlify deploy preview. Wait for **Building…** to finish; **Build Failed** means the preview needs a fix.
5. Review the page: text, links, images and descriptions, dates, and other changed details.
6. When `Validate` and `netlify/uoft-fom-grc/deploy-preview` pass and all comments are resolved, move the draft to **Ready** and publish. Confirm "I reviewed the site preview." when asked.
7. Sveltia merges the draft into `main` and Netlify deploys production. If publishing fails, the draft stays unpublished; fix what the CMS reports and publish again.

The in-editor split preview is disabled. **View Preview** is the only authoritative preview. Saving a draft never changes the public site.

## Team and About Page

**About Page** holds every part of the About page at `/about`, from top to bottom:

- **Headline**, **Introduction** and one or two **Headline Buttons**. The first button is filled in and the second is outlined; `#our-work` jumps to the Our Work section.
- **Survey Figure**: the grid of 100 dots beside the headline. **Number Out Of 100** sets how many dots are filled in, **Statement** reads on from the number, and **Source** names the survey, its year and how many people answered. Check the number with the Data Analysts before turning on **Show Survey Figure**, and update it when a new report comes out. With the switch off, the headline spans the page.
- The blue band: **Purpose Heading**, **Purpose Paragraphs**, **Objectives Introduction** and up to three **Objectives**, each with one large keyword ("inform.", "listen.", "advocate.") and a sentence.
- **Our Work**: **Work Heading**, **Work Paragraphs** and exactly four **Yearly Loop Steps**. Step 1 sits at the top of the circle and the rest go clockwise; on phones the steps are a numbered list. **Loop Centre Label** and **Loop Centre Note** fill the middle of the circle.
- **Resources Band**: one line of text with one or two buttons.
- **Contact Question**: the question above the email address and Instagram link at the bottom of the page. The address and link come from **Contact and Social Links** in **Advanced Site Settings**, and the team photos and **Meet the team** button beside them come from the current team year and **Team Page Heading**.

## Resources, Blog and Contact Pages

This area holds the photo band at the top of the Resources, Blog and Contact pages, plus:

- **Resources Page:** the search box text, the **Need Help Now** phone numbers shown first (check each number before publishing), and **New and Coming Soon**, a sideways-scrolling row of small cards at the bottom of the page. That row stays hidden while its list is empty. The topic cards under **Browse by topic** come from the eight resource pages: each card shows the page's **Resource Card Title** and **Search and Sharing Summary**, in the **Resources Menu Links** order set in **Advanced Site Settings**.
- **Contact Page:** only the photo band. The email, Instagram and GitHub cards come from **Contact and Social Links** in **Advanced Site Settings**.

On the Blog page, each current post appears under its **Blog Page Topic**. Ended posts (archived or expired) are listed by academic year in the folded Archive at the bottom.

## Advanced Site Settings

**Advanced Site Settings** affects every page. It holds the header brand and navigation links, the Resources link, and the contact email plus social links used in the homepage hero, the About page and the Contact page. Turn on **Coming Soon** for a navigation link whose page is not published yet: it shows the label with a "Soon" tag and no link. **Resources Menu Label** is the text of the Resources link in the top bar, and **Resources Menu Position** sets how many main links come before it. In URL fields use `https://` for external pages, `/about` for a page on this site, `mailto:grc.facmed@utoronto.ca` for email, `tel:+14161234567` for telephone, or `#contact` for a section of the current page. **Resources Menu Links** has one entry per fixed resource page; choose the page from the list instead of typing a route, and drag entries to set the order of the topic cards under **Browse by topic** on the Resources page.

## Guardrails

- Blog post URL comes from the file name, not the title. Discard never-published drafts when they are no longer needed. Published blog deletion is blocked; set **Visibility** to **Archived** so the existing URL survives.
- **Updated Date** is set automatically whenever an existing blog post is saved with changes.
- Resource page URLs are protected. Existing section anchors are public links: do not change or repurpose them. Add new sections or cards instead.
- Team years and members display in listed order; drag to reorder. **Current Team Year** must exactly match one listed **Academic Year** text, or the site build fails and publishing is blocked. Add photo and photo description together. A member without a photo shows their initials. **Pronouns** and **Bio** are optional; leave them empty unless the member supplied them. On the Team page, the current year shows photo cards, and a bio appears over the photo when a visitor hovers over or tabs to the card. Anyone whose **Position** includes "Advisor" is listed under Advisors as a small name card. Past years are folded; visitors can open as many as they like. **Team Page Heading** sets the photo band at the top of the Team page.
- Homepage hero needs two to five lines. The first line is a small label above the heading, the second line is the page heading (keep it descriptive), and any further lines appear under it as a tagline.
- **Hero Buttons** are up to three small buttons under the social links on the homepage. The first is filled in and the rest are outlined. While **Coming Soon** is on, a button shows a "Soon" tag and is not a link. When its page is ready, turn **Coming Soon** off and add its **Link**.
- Homepage announcements display only when **Show on Homepage** is enabled; list order controls display order. An active announcement requires an expiry date and stays up through that Toronto date, then hides at the next scheduled daily rebuild. Leave an announcement inactive to keep it as an unpublished training item.
- Blog posts and active announcements expire automatically on their Toronto calendar date. Expired or archived content stays at its URL with a historical notice, leaves topic listings, resource pages, search, feeds and the sitemap, and is marked `noindex`. Ended blog posts are still listed in the Blog page's folded Archive.
- Every blog post needs a **Blog Page Topic**. A post saved without one appears under **More posts** at the end of the Blog page.
- **Resource Card Image** is the preview picture shown when a resource page is shared in a message or on social media; it no longer appears on the Resources page itself.
- External links need `https://`; email needs `mailto:`; phone needs `tel:`.

## Image workflow

Upload images through an image field. The CMS converts JPEG, PNG, and WebP uploads to optimized WebP under `public/assets/`, limits them to 2048 × 2048 without upscaling, and requires an image description for every supplied image. Prefer descriptive file names; uploads are slugified.

Legacy images already visible on the site remain available to the build. For a replacement, upload a new image rather than editing a legacy path.

## Help and recovery

- Access, publishing, or content questions: <grc.facmed@utoronto.ca>
- Publishing checks and merge gates: [self-publishing and checks guide](REVIEW_AND_RELEASE.md)
- Harmful, private, or urgent content: stop publishing and follow [rollback](ROLLBACK.md).
