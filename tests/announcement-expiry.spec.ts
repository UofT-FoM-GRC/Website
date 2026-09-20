import { expect, test } from '@playwright/test'
import { createAnnouncementsSchema } from '../src/schemas'
import { isAnnouncementVisible } from '../src/utils/announcements'

const schema = createAnnouncementsSchema()

test('omitted empty announcement list defaults to an empty array', () => {
	expect(schema.parse({})).toEqual({ items: [] })
})

test('active announcements require an expiry date at the item field path', () => {
	const result = schema.safeParse({
		items: [{ title: 'Training announcement', text: 'A valid message.', active: true }]
	})

	expect(result.success).toBeFalsy()
	if (!result.success) {
		expect(result.error.issues).toContainEqual({
			code: 'custom',
			path: ['items', 0, 'expiresOn'],
			message: 'Active announcements require an expiry date.'
		})
	}
})

test('active announcements accept an expiry date and an optional link URL', () => {
	const result = schema.safeParse({
		items: [
			{
				title: 'Training announcement',
				text: 'A valid message.',
				url: 'https://example.com/details',
				expiresOn: '2026-01-15',
				active: true
			}
		]
	})

	expect(result.success).toBeTruthy()
	if (result.success) {
		expect(result.data.items[0].expiresOn).toEqual(new Date('2026-01-15T00:00:00.000Z'))
	}

	const withoutUrl = schema.safeParse({
		items: [{ title: 'Training announcement', text: 'A valid message.', expiresOn: '2026-01-15', active: true }]
	})
	expect(withoutUrl.success).toBeTruthy()
})

test('inactive announcements may omit an expiry date and stay unpublished training items', () => {
	const result = schema.safeParse({
		items: [{ title: 'Training announcement', text: 'A valid message.', active: false }]
	})

	expect(result.success).toBeTruthy()
	if (result.success) expect(result.data.items[0].expiresOn).toBeUndefined()
})

test('Toronto calendar expiry keeps announcements visible through EST and EDT expiry dates', () => {
	const item = (overrides: Record<string, unknown> = {}) =>
		schema.parse({
			items: [
				{
					title: 'Training announcement',
					text: 'A valid message.',
					expiresOn: '2026-01-15',
					active: true,
					...overrides
				}
			]
		}).items[0]

	const winterExpiry = item()
	expect(isAnnouncementVisible(winterExpiry, new Date('2026-01-15T12:00:00.000Z'))).toBeTruthy()
	expect(isAnnouncementVisible(winterExpiry, new Date('2026-01-16T04:59:59.000Z'))).toBeTruthy()
	expect(isAnnouncementVisible(winterExpiry, new Date('2026-01-16T05:00:00.000Z'))).toBeFalsy()

	const summerExpiry = item({ expiresOn: '2026-07-15' })
	expect(isAnnouncementVisible(summerExpiry, new Date('2026-07-15T12:00:00.000Z'))).toBeTruthy()
	expect(isAnnouncementVisible(summerExpiry, new Date('2026-07-16T03:59:59.000Z'))).toBeTruthy()
	expect(isAnnouncementVisible(summerExpiry, new Date('2026-07-16T04:00:00.000Z'))).toBeFalsy()
})

test('inactive announcements stay hidden even with a valid future expiry date', () => {
	const inactive = schema.parse({
		items: [
			{
				title: 'Training announcement',
				text: 'A valid message.',
				expiresOn: '2026-01-15',
				active: false
			}
		]
	}).items[0]

	expect(isAnnouncementVisible(inactive, new Date('2026-01-01T12:00:00.000Z'))).toBeFalsy()
})
