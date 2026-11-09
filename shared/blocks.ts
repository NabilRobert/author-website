/**
 * Page blocks: the pieces the owner stacks to build a page, like a website
 * builder. Some hold their own words and pictures (hero, text, picture and
 * text, list, quote, buttons); others show the author's books, news or
 * contact details, which are kept once and edited in their own tabs.
 *
 * To add a block type: add its schema here, add it to `blockSchema`, give it
 * a name in `BLOCK_NAMES`, and add a component in src/components/blocks/.
 */
import { z } from 'zod'
import { optionalColour } from './theme'
import { imageKey, itemId, linkSchema, linkTarget, longText, requiredText, shortText } from './fields'

const heroBlock = z.object({
  id: itemId,
  type: z.literal('hero'),
  heading: requiredText('Add a heading for the banner.'),
  subheading: shortText,
  imageKey,
  buttonLabel: shortText,
  buttonUrl: z.union([z.literal(''), linkTarget]),
  // '' uses the site's colours.
  backgroundColour: optionalColour,
  textColour: optionalColour,
})

const textBlock = z.object({
  id: itemId,
  type: z.literal('text'),
  heading: shortText,
  body: longText.min(1, 'Add some text, or remove this block.'),
})

const imageTextBlock = z.object({
  id: itemId,
  type: z.literal('imageText'),
  heading: shortText,
  body: longText,
  imageKey,
  imageSide: z.enum(['left', 'right']),
})

const listBlock = z.object({
  id: itemId,
  type: z.literal('list'),
  heading: shortText,
  numbered: z.boolean(),
  items: z.array(requiredText('Fill in or remove the empty list item.')).min(1, 'Add at least one item.'),
})

const quoteBlock = z.object({
  id: itemId,
  type: z.literal('quote'),
  quote: longText.min(1, 'Add the quote.'),
  source: shortText,
})

const buttonsBlock = z.object({
  id: itemId,
  type: z.literal('buttons'),
  heading: shortText,
  links: z.array(linkSchema).min(1, 'Add at least one button.'),
})

const booksBlock = z.object({
  id: itemId,
  type: z.literal('books'),
  heading: shortText,
  show: z.enum(['all', 'newest']),
})

const newsBlock = z.object({
  id: itemId,
  type: z.literal('news'),
  heading: shortText,
  // How many of the latest items to show; null shows them all.
  limit: z.number().int().positive().nullable(),
})

const contactBlock = z.object({ id: itemId, type: z.literal('contact'), heading: shortText })
const pressKitBlock = z.object({ id: itemId, type: z.literal('pressKit'), heading: shortText })

export const blockSchema = z.discriminatedUnion('type', [
  heroBlock,
  textBlock,
  imageTextBlock,
  listBlock,
  quoteBlock,
  buttonsBlock,
  booksBlock,
  newsBlock,
  contactBlock,
  pressKitBlock,
])

export type Block = z.infer<typeof blockSchema>
export type BlockType = Block['type']
/** One block type's fields, for that block's component: `BlockOf<'hero'>`. */
export type BlockOf<T extends BlockType> = Extract<Block, { type: T }>

/** What the editor calls each block type, in the order it offers them. */
export const BLOCK_NAMES: Record<BlockType, string> = {
  hero: 'Big banner',
  text: 'Text',
  imageText: 'Picture and text',
  list: 'List',
  quote: 'Quote',
  buttons: 'Buttons',
  books: 'Your books',
  news: 'News and events',
  contact: 'Contact details',
  pressKit: 'Press kit',
}
