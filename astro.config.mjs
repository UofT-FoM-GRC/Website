import alpinejs from '@astrojs/alpinejs'
import { unified } from '@astrojs/markdown-remark'
import mdx from '@astrojs/mdx'
import icon from 'astro-icon'
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import remarkDirective from 'remark-directive'
import { semanticBlockRemarkPlugin } from './src/utils/semanticBlocks'

// https://astro.build/config
export default defineConfig({
	site: 'https://uoftfomgrc.ca',
	compressHTML: true,
	integrations: [mdx(), icon(), alpinejs()],
	markdown: {
		processor: unified({ remarkPlugins: [remarkDirective, semanticBlockRemarkPlugin] })
	},
	output: 'static',
	vite: {
		plugins: [tailwindcss()]
	}
})
