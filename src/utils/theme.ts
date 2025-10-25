/**
 * Simple theme management - basic light/dark toggle
 */

const THEME_STORAGE_KEY = 'grc-theme'
type Theme = 'light' | 'dark'

/**
 * Get the current theme from localStorage (defaults to 'light')
 */
export function getCurrentTheme(): Theme {
	if (typeof window === 'undefined') return 'light'

	const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
	console.log('[theme.ts] getCurrentTheme() - stored value:', stored)

	// Default to light if nothing stored
	return stored === 'dark' ? 'dark' : 'light'
}

/**
 * Apply theme to the document by adding/removing dark class
 */
export function applyTheme(theme: Theme): void {
	if (typeof document === 'undefined') {
		console.log('[theme.ts] applyTheme() - document undefined')
		return
	}

	const html = document.documentElement
	console.log('[theme.ts] applyTheme() - applying theme:', theme)

	if (theme === 'dark') {
		html.classList.add('dark')
		console.log('[theme.ts] applyTheme() - added dark class')
	} else {
		html.classList.remove('dark')
		console.log('[theme.ts] applyTheme() - removed dark class')
	}

	// Save to localStorage
	localStorage.setItem(THEME_STORAGE_KEY, theme)
	console.log('[theme.ts] applyTheme() - saved to localStorage:', theme)
	console.log('[theme.ts] applyTheme() - html.className is now:', html.className)
}

/**
 * Toggle between light and dark themes
 */
export function toggleTheme(): Theme {
	const current = getCurrentTheme()
	const next: Theme = current === 'light' ? 'dark' : 'light'

	console.log('[theme.ts] toggleTheme() - current:', current, 'next:', next)
	applyTheme(next)

	return next
}
