import alpinejs from '@astrojs/alpinejs'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwind from '@astrojs/tailwind'
import icon from 'astro-icon'
import { defineConfig } from 'astro/config'

import netlify from '@astrojs/netlify'

// https://astro.build/config
export default defineConfig({
	site: 'https://uoftfomgrc.ca',
	integrations: [mdx(), sitemap(), tailwind(), icon(), alpinejs()],
	output: 'static',
	adapter: netlify()
})
