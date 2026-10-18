/** How each social network is named and described on the Contact and About pages. */
export const networkDetails = {
	instagram: { name: 'Instagram', icon: 'mdi:instagram', note: 'Updates, reminders and event photos.' },
	github: { name: 'GitHub', icon: 'mdi:github', note: 'The code behind this website.' }
} as const

export type SocialNetwork = keyof typeof networkDetails

/** Show the handle or organization name from the link, for example @grc_uoftfacmed. */
export const handleFrom = (url: string, network: SocialNetwork): string => {
	const last = url.replace(/\/+$/, '').split('/').at(-1) ?? url
	return network === 'instagram' ? `@${last}` : last
}
