;(() => {
	const torontoDate = (now = new Date()) => {
		const parts = new Intl.DateTimeFormat('en-CA', {
			timeZone: 'America/Toronto',
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		}).formatToParts(now)
		const value = (type) => parts.find((part) => part.type === type)?.value
		return `${value('year')}-${value('month')}-${value('day')}`
	}

	window.CMS.registerEventListener({
		name: 'preSave',
		handler: ({ entry }) => {
			if (entry.get('collection') !== 'blog' || entry.get('newRecord')) return
			return entry.setIn(['data', 'updatedDate'], torontoDate())
		}
	})
})()
