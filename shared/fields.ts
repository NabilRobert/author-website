/**
 * Field rules shared by the content schema and the block schemas: text
 * lengths, web addresses, dates, image keys and ids. The error messages are
 * shown to the site's owner in the editor, so they say what to fix.
 */
import { z } from 'zod'

/** Longest blurb, bio, post or text block; a few screens of text. */
const MAX_LONG_TEXT = 5000
/** Longest title, name, label or place. */
const MAX_SHORT_TEXT = 200

export const shortText = z.string().trim().max(MAX_SHORT_TEXT, 'Keep this under 200 characters.')
export const longText = z.string().trim().max(MAX_LONG_TEXT, 'Keep this under 5,000 characters.')
export const requiredText = (whatIsMissing: string) => shortText.min(1, whatIsMissing)

// Only http and https: a `javascript:` link in a button would run code in
// visitors' browsers.
export const webAddress = z.url({
  protocol: /^https?$/,
  error: 'Enter a full web address starting with https://',
})
export const optionalWebAddress = z.union([z.literal(''), webAddress])

/**
 * A page on this site ("/books") or a full web address. "//other.site" is
 * refused: browsers read it as a link to another site.
 */
export const linkTarget = z.union([
  z.string().regex(/^\/(?!\/)[a-z0-9\-/#]*$/, 'Enter a page on this site like /books, or a full web address.'),
  webAddress,
])

/** A calendar date, as the date picker gives it: 2026-11-09. */
export const calendarDate = z.iso.date({ error: 'Pick a date.' })

/** An image stored in R2, by its key (`images/<uuid>.jpg`), or none. */
export const imageKey = z
  .string()
  .regex(/^images\/[a-z0-9-]+\.(jpg|png|webp)$/, 'That image could not be found. Upload it again.')
  .nullable()

/**
 * How a picture sits in its frame: the point to keep in view (x and y, in
 * percent of the picture) and how far to zoom in. The file itself is never
 * cut, so the same picture fits frames of any shape, and the press kit
 * still offers the whole original.
 */
export const imageCropSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  zoom: z.number().min(1).max(3),
})
export type ImageCrop = z.infer<typeof imageCropSchema>
export const centredCrop = (): ImageCrop => ({ x: 50, y: 50, zoom: 1 })
/** A crop that defaults to centred, for pictures saved before cropping existed. */
export const imageCrop = imageCropSchema.default(centredCrop)

/** A stable id for a list item, so the editor can reorder items safely. */
export const itemId = z.uuid()

export const linkSchema = z.object({
  label: requiredText('Give the link a name, like "Amazon".'),
  url: linkTarget,
})

export type Link = z.infer<typeof linkSchema>
