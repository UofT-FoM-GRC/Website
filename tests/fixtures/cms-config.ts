import { readFileSync } from 'node:fs'
import { parseDocument } from 'yaml'

export type Field = {
	name: string
	widget?: string
	required?: boolean
	accept?: string
	options?: unknown[]
	pattern?: unknown[]
	hint?: string
	min?: number
	max?: number
	default?: unknown
	field?: Field
	fields?: Field[]
	types?: Field[]
}

export type Collection = {
	name: string
	label: string
	description?: string
	folder?: string
	extension?: string
	format?: string
	create?: boolean
	delete?: boolean
	preview_path?: string
	fields?: Field[]
	files?: Array<{ name: string; file: string; preview_path?: string; fields: Field[] }>
}

export type Config = {
	backend: Record<string, unknown>
	publish_mode: string
	site_url: string
	editor: { preview: boolean }
	output: { omit_empty_optional_fields: boolean }
	media_libraries?: {
		default?: {
			config?: {
				max_file_size?: number
				slugify_filename?: boolean
				transformations?: {
					raster_image?: { format?: string; quality?: number; width?: number; height?: number }
				}
			}
		}
	}
	collections: Collection[]
}

export const readCmsConfig = () => {
	const source = readFileSync(new URL('../../public/admin/config.yml', import.meta.url), 'utf8')
	const document = parseDocument(source, { uniqueKeys: true })
	if (document.errors.length) throw new Error(`CMS configuration parse errors: ${document.errors.join(', ')}`)
	return { source, config: document.toJS() as Config }
}

export const getCollection = (config: Config, name: string) => {
	const collection = config.collections.find((candidate) => candidate.name === name)
	if (!collection) throw new Error(`Missing ${name} task area`)
	return collection
}

export const getField = (fields: Field[], name: string) => {
	const field = fields.find((candidate) => candidate.name === name)
	if (!field) throw new Error(`Missing ${name} field`)
	return field
}
