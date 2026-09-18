import alpinejs from '@astrojs/alpinejs'
import mdx from '@astrojs/mdx'
import icon from 'astro-icon'
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'

// https://astro.build/config
export default defineConfig({
	site: 'https://uoftfomgrc.ca',
	compressHTML: true,
	integrations: [mdx(), icon(), alpinejs()],
	output: 'static',
	vite: {
		plugins: [tailwindcss()]
	}
})
