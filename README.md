<p align="center">
  <a href="" rel="noopener">
 <img width=200px height=200px src="public/uoft-coa.webp" style="border-radius: 50%; border: 1px solid #002e62;" alt="UofT Logo"></a>
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
- [Getting Started](#🏁-getting_started)
- [Deployment](#🚀-deployment)
- [Built Using](#⛏️-built_using)
- [Authors](#✍️-authors)
- [Acknowledgments](#🎉-acknowledgements)

## 🧐 About

The Graduate Representation Committee (GRC) is a group of graduate students who represent the interests of all graduate students in the University of Toronto Faculty of Medicine. We support and advocate for graduate students, keep them informed about important policies, and actively seek their feedback to ensure our advocacy aligns with their needs.

## 🏁 Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See [deployment](#deployment) for notes on how to deploy the project on a live system.

### Prerequisites

You will need a GitHub account to access the repository.

### Installing (for developers)

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

### Adding/Updating Blog Posts (for writers)

Blog posts are stored in `src/content/blog`. They are written in Markdown, just like this `README.md` file. Please refer to the following cheatsheet for Markdown syntax: 

[Markdown Cheatsheet](https://www.markdownguide.org/cheat-sheet/)

The following rules apply to blog posts:

1. All blog post markdown files **must be** in lower kebab case (i.e. `this-is-a-blog-post.md`) and avoid special characters (i.e. `&` should be `and`).
2. The start of the Markdown file contains the following syntax referred to as a "frontmatter" block:

```
---
title: Title of Blog Post
description: Short description of what the blog post is about
pubDate: Date of publication, ideally in ISO 8601 format (YYYY-MM-DD)
updatedDate: Date of last update, ideally in ISO 8601 format (YYYY-MM-DD)
heroImage: Local relative path or URL to main banner image for blog post.
tags: An array of tags relevant to the blog post. These will be rendered as buttons on blog post cards.
---
```
This **must be** included at the top of every blog post and is used to generate the blog post card on the blogs page.

3. The heroImage **is optional**. It can also be an external URL, for example: https://en.wikipedia.org/wiki/University_of_Toronto#/media/File:UofTConvocationHall.jpg. If not provided, a placeholder image will be used:

<img src="public/uoft-placeholder-default.webp" alt="GRC Blog Post Placeholder Image" width="240" height="200">

4. **At least one tag must be provided**. They assist with blog post organization and linking to relevant resource pages. The following tags are available:

- **`employment`** - For blog posts related to employment (i.e. hiring TAs, finding a job, etc.)
- **`career-planning-exploration`** - For blog posts related to career planning and exploration (i.e. resume tips, interview advice, etc.)
- **`continuing-education`** - For blog posts related to continuing education (i.e. courses, workshops, etc.)
- **`health-wellness`** - For blog posts related to health and wellness (i.e. mental health, fitness, etc.)
- **`housing`** - For blog posts related to housing (i.e. listings, tips, etc.)
- **`scholarships-bursaries-awards`** - For blog posts related to scholarships, bursaries, and awards (i.e. listing etc.)
- **`scholarship-award-grant-application-support`** - For blog posts related to scholarship, award, and grant application support (i.e. workshops, help with applications, etc.)
- **`other`** - For blog posts that don't fit into the above categories.

So, for example the following is the frontmatter for this blog post:

```
---
title: 'UofT Hiring TAs'
description: 'How to hire Teaching Assistants at the University of Toronto'
pubDate: 'Sep 3 2024'
heroImage: '/uoft-career-fair-banner.webp'
tags: ['employment']
---
```


## 🚀 Deployment

Everything is automated to deploy to Netlify once changes on `main` are detected. Keep it simple. No manual deployment steps are required.

## ⛏️ Built Using

- [Astro](https://astro.build/) - Web Framework
- [TailwindCSS](https://tailwindcss.com/) - CSS Framework

## ✍️ Authors

- [@MauricePasternak](https://github.com/MauricePasternak) - Idea & Initial work

See also the list of [contributors](https://github.com/UofT-FoM-GRC/Website/contributors) who participated in this project.

## 🎉 Acknowledgements

- All the members of the GRC, past and present, for their hard work and dedication to the graduate student body.
