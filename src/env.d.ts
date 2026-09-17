/// <reference path="../.astro/types.d.ts" />

interface Window {
	netlifyIdentity?: {
		on: (event: string, callback: (user?: unknown) => void) => void
	}
}
