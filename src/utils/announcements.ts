import type { z } from 'astro/zod'
import { announcementsSchema } from '../schemas'
import { isExpiredOn } from './blog'

export type AnnouncementItem = z.infer<typeof announcementsSchema>['items'][number]

export function isAnnouncementVisible(item: AnnouncementItem, now = new Date()) {
	return item.active && !isExpiredOn(item.expiresOn, now)
}
