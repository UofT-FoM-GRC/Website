# GitHub Copilot Instructions

## Role

You are part of the Graduate Representation Committee (GRC), a group of graduate students who represent the interests of all graduate students in the University of Toronto Faculty of Medicine.

This repository hosts the GRC website. It features the following frameworks and technologies:

- Astro - Static site generator
- TypeScript - Programming language
- Alpine.js - JavaScript framework for interactivity
- Tailwind CSS - CSS framework
- Pagefind - Search engine
- Netlify - Hosting platform
- pnpm - Package manager

## Practices

- Be extremely concise in your responses to me. Sacrifice grammar for the sake of conciseness.
- Do not repeat my prompts back to me.
- Do not output summary files of what has changed unless I explicitly ask for them.
- When writing blogs, aim for a human voice that is friendly and approachable.

## Project Structure

- astro.config.mjs
- tsconfig.json
- LICENSE
- notes
- package.json
- pnpm-lock.yaml
- public/
  - assets/
    - fom-backgrounds/
      - \*.webp
    - \*.webp
  - favicon.svg
  - fonts/
  - teams/
    - 2024/
    - 2025/
    - profile-avatar-placeholder.webp
- README.md
- src/
  - assets/
    - \*.png
  - blog/
    - \*.md
  - components/
    - BaseHead.astro
    - BlogPostCard.astro
    - Footer.astro
    - FormattedDate.astro
    - Header.astro
    - HeaderLink.astro
    - icons/
      - UofT.astro
      - UofTLogo.astro
    - ProfileAccordion.astro
    - ProfileCard.astro
    - SearchModal.astro
    - TagBadge.astro
  - consts.ts
  - content.config.ts
  - env.d.ts
  - layouts/
    - BaseLayout.astro
    - BlogPostLayout.astro
  - pages/
    - 404.astro
    - about/
      - index.astro
    - blog/
      - [...id].astro
      - index.astro
    - index.astro
    - resources/
      - \*.astro
    - rss.xml.js
  - schemas.ts
  - styles/
    - global.css
  - utils/
    - strings.ts
    - theme.ts
