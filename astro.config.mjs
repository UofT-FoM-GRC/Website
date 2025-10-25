import alpinejs from '@astrojs/alpinejs'
import mdx from '@astrojs/mdx'
import netlify from '@astrojs/netlify'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import icon from 'astro-icon'
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
	site: 'https://uoftfomgrc.ca',
	integrations: [mdx(), sitemap(), icon(), alpinejs(), react()],
	output: 'static',
	adapter: netlify(),
	vite: {
		plugins: [tailwindcss()]
	}
})
