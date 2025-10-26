<p align="center">
  <a href="" rel="noopener">
 <img width=200px height=200px src="public/assets/grc-logo.webp" alt="GRC Logo"></a>
</p>

<h3 align="center"></h3>

<div align="center">

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![GitHub Issues](https://img.shields.io/github/issues/UofT-FoM-GRC/Website.svg)](https://github.com/UofT-FoM-GRC/Website/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/UofT-FoM-GRC/Website.svg)](https://github.com/UofT-FoM-GRC/Website/pulls)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Netlify Status](https://api.netlify.com/api/v1/badges/a9e898e9-69bc-4f45-bd5e-26992e2a08ab/deploy-status)](https://app.netlify.com/sites/uoft-fom-grc/deploys)

</div>

---

<p align="center"> Website for the University of Toronto Faculty of Management Graduate Representation Committee.
    <br> 
    <strong style="font-size: 1.5em;"><a href="https://uoft-fom-grc.netlify.app/" target="_blank">View Live Site</a></strong>
</p>

## 📝 Table of Contents

- [About](#🧐-about)
- [Content Management with Decap CMS](#📝-content-management-with-decap-cms)
- [Getting Started (Developers)](#🏁-getting_started)
- [Deployment](#🚀-deployment)
- [Built Using](#⛏️-built_using)
- [Authors](#✍️-authors)
- [Acknowledgments](#🎉-acknowledgements)

## 🧐 About

The Graduate Representation Committee (GRC) is a group of graduate students who represent the interests of all graduate students in the University of Toronto Faculty of Medicine. We support and advocate for graduate students, keep them informed about important policies, and actively seek their feedback to ensure our advocacy aligns with their needs.

## 📝 Content Management with Decap CMS

**For non-technical team members managing blog content.**

### First-Time Setup

1. **Get GitHub Access**
   - Ask the current website maintainer to add you as a collaborator to the [GitHub repository](https://github.com/UofT-FoM-GRC/Website)
   - You'll receive an email invitation - accept it

2. **Enable Netlify OAuth**
   - The website admin needs to enable GitHub OAuth in [Netlify settings](https://app.netlify.com/sites/uoft-fom-grc/settings/access) (one-time setup)

### Accessing the CMS

1. Go to: **https://uoft-fom-grc.netlify.app/admin/**
2. Click **"Login with GitHub"**
3. Authorize the application if prompted

### Creating a New Blog Post

1. In the CMS dashboard, click **"Blog Posts"** in the left sidebar
2. Click **"New Blog Post"** button (top right)
3. Fill in the fields:

   - **Title**: Your blog post title (e.g., "UofT Career Fair 2025")
   - **Description**: 1-2 sentence summary for the blog card
   - **Publish Date**: Click the calendar icon and select the date
   - **Updated Date**: Leave empty for new posts
   - **Hero Image**: 
     - Click **"Choose an image"**
     - Either upload a new image or select from existing `/assets` folder
     - **Optional** - a placeholder will be used if not provided
   - **Tags**: Select 1-3 relevant tags from the dropdown (at least 1 required)
   - **Body**: Write your content using Markdown formatting

4. Click **"Save"** (top left) - this creates a draft
5. When ready, change status to **"In review"** then **"Ready"**
6. Click **"Publish"** → **"Publish now"**

### Editing an Existing Blog Post

1. Click **"Blog Posts"** in the sidebar
2. Find and click on the post you want to edit
3. Make your changes
4. Update the **"Updated Date"** field
5. Save and publish as above

### Understanding the Workflow

**Important**: Changes go through a review process to avoid accidental builds:

- **Draft**: Work in progress, not visible on site
- **In Review**: Ready for team review
- **Ready**: Approved, ready to publish

When you publish, changes are committed to the `dev` branch. The team will merge `dev` → `main` when ready to deploy live.

### Working with Images

**Best Practices:**
- Use `.webp` format for smaller file sizes
- Recommended dimensions: 1200x630px for hero images
- Keep file sizes under 500KB
- Use descriptive filenames: `career-fair-2025.webp` not `img123.webp`

**To upload images:**
1. Click "Hero Image" field → "Choose an image" → "Upload"
2. Or reference existing images in `/assets` folder

**To use images in blog body:**
```markdown
![Alt text describing the image](/assets/your-image.webp)
```

### Available Tags

Choose tags that match your content:

- **employment** - Job postings, TA hiring, work opportunities
- **career-planning-exploration** - Resume tips, career advice, mentorship
- **continuing-education** - Courses, workshops, certifications
- **health-wellness** - Mental health, fitness, wellness resources
- **housing** - Housing listings, tips, rental information
- **scholarships-bursaries-awards** - Funding opportunities, awards
- **scholarship-award-grant-application-support** - Application help, workshops
- **other** - Content that doesn't fit above categories

### Markdown Quick Reference

```markdown
# Heading 1
## Heading 2
### Heading 3

**bold text**
*italic text*

- Bullet point
- Another point

1. Numbered list
2. Second item

[Link text](https://example.com)

![Image alt text](/assets/image.webp)
```

Full guide: [Markdown Cheatsheet](https://www.markdownguide.org/cheat-sheet/)

### File Naming Rules

When creating new blog posts, the filename is auto-generated from your title:
- Lowercase only
- Spaces become hyphens
- No special characters
- Example: "Career Fair 2025!" → `career-fair-2025.md`

### Getting Help

**Common Issues:**

1. **Can't login**: Make sure you've been added as a GitHub collaborator
2. **Can't publish**: Check that you've set status to "Ready" first
3. **Image not showing**: Verify path starts with `/assets/`
4. **Missing required field**: Title, Description, Publish Date, and at least 1 tag are required

**Need assistance?** Contact the website maintainer or check the [GitHub Issues](https://github.com/UofT-FoM-GRC/Website/issues).

---

## 🏁 Getting Started (Developers)

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See [deployment](#deployment) for notes on how to deploy the project on a live system.

### Prerequisites

You will need a GitHub account to access the repository.

### Installing

Standard `git clone` to download the repository:

```bash
git clone https://github.com/UofT-FoM-GRC/Website.git
cd Website
```
It's recommended to use [pnpm](https://pnpm.io/installation) to install the dependencies.

```bash
pnpm install
```

Never work on `main`. At minimum, go to `dev` first:

```bash
git checkout dev
```

More preferably, create feature braches off of `dev`:

```bash
git checkout -b <feature-branch-name>
```

### Testing Decap CMS Locally

To test the CMS interface locally without GitHub OAuth:

1. Install the Decap CMS proxy server:
```bash
npx decap-server
```

2. In another terminal, run the dev server:
```bash
pnpm dev
```

3. Access CMS at `http://localhost:4321/admin/`

**Note**: Local mode bypasses authentication and workflow - changes save directly.

### Manual Blog Post Editing (Alternative to CMS)

**Recommended**: Use Decap CMS (see Content Management section above) for a visual interface.

**Alternative for developers**: Blog posts are stored in `src/blog/`. They are written in Markdown.

Refer to: [Markdown Cheatsheet](https://www.markdownguide.org/cheat-sheet/)

**Rules:**

1. Filenames **must be** lowercase kebab-case: `this-is-a-post.md`
2. Required frontmatter structure:

```yaml
---
title: 'Post Title'
description: 'Brief description'
pubDate: 'Nov 1 2024'
updatedDate: 'Nov 5 2024'  # optional
heroImage: '/assets/image.webp'  # optional
tags: ['employment', 'other']  # at least 1 required
---
```

3. Available tags: `employment`, `career-planning-exploration`, `continuing-education`, `health-wellness`, `housing`, `scholarships-bursaries-awards`, `scholarship-award-grant-application-support`, `other`

## 🚀 Deployment

Everything is automated to deploy to Netlify once changes on `main` are detected. Keep it simple. No manual deployment steps are required.

## ⛏️ Built Using

- [Astro](https://astro.build/) - Web Framework
- [TailwindCSS](https://tailwindcss.com/) - CSS Framework

## ✍️ Authors

- [@MauricePasternak](https://github.com/MauricePasternak) - Creator and current maintainer

See also the list of [contributors](https://github.com/UofT-FoM-GRC/Website/contributors) who participated in this project.

## 🎉 Acknowledgements

- All the members of the GRC, past and present, for their hard work and dedication to the graduate student body.
