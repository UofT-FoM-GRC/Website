type Member = { name: string; position: string }

/** Members whose position mentions "Advisor" are listed under Advisors; everyone else is on the executive team. */
export const isAdvisor = (member: Member): boolean => /advisor/i.test(member.position)

/** Executive members first, then advisors, each group in stored order. */
export const executivesFirst = <M extends Member>(members: M[]): M[] => [
	...members.filter((member) => !isAdvisor(member)),
	...members.filter(isAdvisor)
]

/** "2026 - 2027" becomes "2026–27"; any other text is shown as written. */
export const shortYear = (year: string): string => {
	const match = year.match(/^(\d{4})\s*-\s*(\d{4})$/)
	return match ? `${match[1]}–${match[2].slice(2)}` : year
}

/** First letters of the first and last words, shown when a member has no photo. */
export const memberInitials = (name: string): string => {
	const words = name.split(/\s+/).filter(Boolean)
	const letters = words.length > 1 ? [words[0], words[words.length - 1]] : words
	return letters.map((word) => word[0]!.toUpperCase()).join('')
}
