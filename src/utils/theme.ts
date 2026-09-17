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

	let stored: Theme | null = null
	try {
		stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
	} catch {
		// Storage is optional; the document class remains the source of truth.
	}
	return stored === 'dark' ? 'dark' : 'light'
}

/**
 * Apply theme to the document by adding/removing dark class
 */
export function applyTheme(theme: Theme): void {
	if (typeof document === 'undefined') return

	const html = document.documentElement
	html.classList.toggle('dark', theme === 'dark')
	try {
		localStorage.setItem(THEME_STORAGE_KEY, theme)
	} catch {
		// Storage is optional; the selected theme still applies for this page.
	}
}

/**
 * Toggle between light and dark themes
 */
export function toggleTheme(): Theme {
	const current = getCurrentTheme()
	const next: Theme = current === 'light' ? 'dark' : 'light'

	applyTheme(next)

	return next
}
