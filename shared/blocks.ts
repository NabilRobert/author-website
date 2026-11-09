/**
 * Page blocks: the pieces the owner stacks to build a page, like a website
 * builder. Some hold their own words and pictures (hero, text, picture and
 * text, list, quote, buttons); others show the profile's works, news or
 * contact details, which are kept once and edited in their own tabs.
 *
 * A field added after launch needs a `.default(…)`, so blocks saved before
 * it existed still load (see imageDescription).
 *
 * To add a block type: add its schema here, add it to `blockSchema`, give it
 * a name in `BLOCK_NAMES`, and add a component in src/components/blocks/.
 */
import { z } from 'zod'
import { boxStyleSchema, fillColour, optionalColour, pictureCornersSchema, plainBox, workShapeSchema } from './theme'
import { imageCrop, imageKey, itemId, linkSchema, linkTarget, longText, requiredText, shortText } from './fields'

// Every block's box (shared/theme.ts: boxStyleSchema); plain unless the
// owner styles it, and plain for blocks saved before boxes existed.
const blockStyle = boxStyleSchema.default(plainBox)

// Picture shapes and corners were added after the first saves, hence the
// defaults. 'soft' corners are how pictures looked before the choice existed.
const pictureCorners = pictureCornersSchema.default('soft')
// '' follows the Look tab's shape for pictures of work (theme.workShape).
const workPictureShape = z.union([z.literal(''), workShapeSchema]).default('')

const heroBlock = z.object({
  id: itemId,
  style: blockStyle,
  type: z.literal('hero'),
  heading: requiredText('Add a heading for the banner.'),
  subheading: shortText,
  imageKey,
  imageCrop,
  buttonLabel: shortText,
  buttonUrl: z.union([z.literal(''), linkTarget]),
  // '' uses the site's colours.
  backgroundColour: fillColour,
  textColour: optionalColour,
  // '' lets the banner fit its words; a shape gives it that shape instead.
  bannerShape: z.union([z.literal(''), workShapeSchema]).default(''),
  pictureCorners,
})

const textBlock = z.object({
  id: itemId,
  style: blockStyle,
  type: z.literal('text'),
  heading: shortText,
  body: longText.min(1, 'Add some text, or remove this block.'),
})

const imageTextBlock = z.object({
  id: itemId,
  style: blockStyle,
  type: z.literal('imageText'),
  heading: shortText,
  body: longText,
  imageKey,
  imageCrop,
  // Read aloud to visitors who can't see the picture. Added after the first
  // saves, hence the default.
  imageDescription: shortText.default(''),
  imageSide: z.enum(['left', 'right']),
  imageShape: workShapeSchema.default('portrait'),
  pictureCorners,
})

export const MAX_GALLERY_PICTURES = 24
export const GALLERY_COLUMNS = [2, 3, 4] as const

// A picture in a gallery: the upload, its crop, and what it shows (read
// aloud to visitors who can't see it, and shown under it).
export const galleryPictureSchema = z
  .object({ imageKey, imageCrop, description: shortText })
  .refine((picture) => picture.imageKey !== null, {
    message: 'Upload a picture, or remove this one.',
    path: ['imageKey'],
  })

const galleryBlock = z.object({
  id: itemId,
  style: blockStyle,
  type: z.literal('gallery'),
  heading: shortText,
  pictures: z
    .array(galleryPictureSchema)
    .max(MAX_GALLERY_PICTURES, `A gallery can hold up to ${MAX_GALLERY_PICTURES} pictures.`),
  // How many pictures sit side by side on a wide screen; a phone shows 2.
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  imageShape: workShapeSchema,
  pictureCorners,
})

const listBlock = z.object({
  id: itemId,
  style: blockStyle,
  type: z.literal('list'),
  heading: shortText,
  numbered: z.boolean(),
  items: z.array(requiredText('Fill in or remove the empty list item.')).min(1, 'Add at least one item.'),
})

const quoteBlock = z.object({
  id: itemId,
  style: blockStyle,
  type: z.literal('quote'),
  quote: longText.min(1, 'Add the quote.'),
  source: shortText,
})

const buttonsBlock = z.object({
  id: itemId,
  style: blockStyle,
  type: z.literal('buttons'),
  heading: shortText,
  links: z.array(linkSchema).min(1, 'Add at least one button.'),
})

const booksBlock = z.object({
  id: itemId,
  style: blockStyle,
  type: z.literal('works'),
  heading: shortText,
  // 'picked' shows only the works in pickedWorkIds, in the Work tab's order.
  show: z.enum(['all', 'newest', 'picked']),
  // Added after the first saves, hence the default.
  pickedWorkIds: z.array(itemId).default([]),
  pictureShape: workPictureShape,
  pictureCorners,
})

const newsBlock = z.object({
  id: itemId,
  style: blockStyle,
  type: z.literal('news'),
  heading: shortText,
  // How many of the latest items to show; null shows them all.
  limit: z.number().int().positive().nullable(),
})

const contactBlock = z.object({ id: itemId, style: blockStyle, type: z.literal('contact'), heading: shortText })
const pressKitBlock = z.object({
  id: itemId,
  style: blockStyle,
  type: z.literal('pressKit'),
  heading: shortText,
  photoShape: workShapeSchema.default('portrait'),
  // The pictures of work.
  pictureShape: workPictureShape,
  pictureCorners,
})

export const blockSchema = z.discriminatedUnion('type', [
  heroBlock,
  textBlock,
  imageTextBlock,
  galleryBlock,
  listBlock,
  quoteBlock,
  buttonsBlock,
  booksBlock,
  newsBlock,
  contactBlock,
  pressKitBlock,
])

export type Block = z.infer<typeof blockSchema>
export type GalleryPicture = z.infer<typeof galleryPictureSchema>
export type BlockType = Block['type']
/** One block type's fields, for that block's component: `BlockOf<'hero'>`. */
export type BlockOf<T extends BlockType> = Extract<Block, { type: T }>

/** What the editor calls each block type, in the order it offers them. */
export const BLOCK_NAMES: Record<BlockType, string> = {
  hero: 'Big banner',
  text: 'Text',
  imageText: 'Picture and text',
  gallery: 'Picture gallery',
  list: 'List',
  quote: 'Quote',
  buttons: 'Buttons',
  works: 'Your work',
  news: 'News and events',
  contact: 'Contact details',
  pressKit: 'Press kit',
}
