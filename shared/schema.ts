/**
 * The site's content as one document: the author's details, the books, the
 * news, and the pages built from blocks (shared/blocks.ts).
 *
 * One Zod schema serves three places: the public site renders it, the
 * editor checks the owner's draft against it before saving, and the API
 * checks it again before writing to the database.
 */
import { z } from 'zod'
import { blockSchema } from './blocks'
import { themeSchema } from './theme'
import {
  calendarDate,
  imageKey,
  itemId,
  linkSchema,
  longText,
  optionalWebAddress,
  requiredText,
  shortText,
  webAddress,
} from './fields'

/** Caps that keep one save small; far above what an author site needs. */
export const MAX_PAGES = 30
export const MAX_BLOCKS_PER_PAGE = 40

// Addresses the site itself uses, so a page cannot take them.
const RESERVED_SLUGS = new Set(['edit', 'api'])

export const reviewSchema = z.object({
  quote: longText.min(1, 'Add the quote.'),
  source: requiredText('Say who said it, like "Kirkus Reviews".'),
})

export const authorSchema = z.object({
  name: requiredText('Add your name.'),
  // Used by the press kit and as the site's description in search results.
  bioShort: longText,
  // The headshot offered in the press kit.
  photoKey: imageKey,
  contactEmail: z.union([z.literal(''), z.email('Enter an email address like name@example.com.')]),
  newsletterUrl: optionalWebAddress,
  socialLinks: z.array(linkSchema.extend({ url: webAddress })),
})

export const bookSchema = z.object({
  id: itemId,
  title: requiredText('Add the book title.'),
  // Empty for a book that is not part of a series.
  seriesName: shortText,
  seriesPosition: z.number().int().positive('The number in the series starts at 1.').nullable(),
  publishedOn: z.union([z.literal(''), calendarDate]),
  blurb: longText,
  coverKey: imageKey,
  buyLinks: z.array(linkSchema.extend({ url: webAddress })),
  reviews: z.array(reviewSchema),
})

export const newsItemSchema = z.object({
  id: itemId,
  kind: z.enum(['news', 'event']),
  title: requiredText('Add a headline.'),
  body: longText,
  happensOn: calendarDate,
  place: shortText,
  linkUrl: optionalWebAddress,
})

export const pageSchema = z.object({
  id: itemId,
  // The page's address: '' is the front page, 'books' is /books.
  slug: z.union([
    z.literal(''),
    z
      .string()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lower-case letters, numbers and dashes, like "my-books".')
      .refine((slug) => !RESERVED_SLUGS.has(slug), 'That address is used by the site itself. Pick another.'),
  ]),
  title: requiredText('Give the page a name.'),
  showInMenu: z.boolean(),
  blocks: z.array(blockSchema).max(MAX_BLOCKS_PER_PAGE, `A page can hold up to ${MAX_BLOCKS_PER_PAGE} blocks.`),
})

export const siteContentSchema = z
  .object({
    author: authorSchema,
    theme: themeSchema,
    // Books and news in the order the owner arranged them.
    books: z.array(bookSchema),
    news: z.array(newsItemSchema),
    // Pages in menu order.
    pages: z.array(pageSchema).max(MAX_PAGES, `The site can have up to ${MAX_PAGES} pages.`),
    // When the content was last saved; the API refuses a save made from an
    // older copy, so a forgotten tab cannot undo newer changes.
    updatedAt: z.string(),
  })
  .superRefine(checkPageAddresses)

/** Exactly one front page, and no two pages at the same address. */
function checkPageAddresses(content: { pages: { slug: string }[] }, context: z.RefinementCtx) {
  const slugs = content.pages.map((page) => page.slug)
  if (!slugs.includes('')) {
    context.addIssue({ code: 'custom', path: ['pages'], message: 'The site needs a front page.' })
  }
  const duplicate = slugs.find((slug, index) => slugs.indexOf(slug) !== index)
  if (duplicate !== undefined) {
    const address = duplicate === '' ? 'the front page' : `/${duplicate}`
    context.addIssue({ code: 'custom', path: ['pages'], message: `Two pages use ${address}. Change one.` })
  }
}

export type { Link } from './fields'
export type Review = z.infer<typeof reviewSchema>
export type Author = z.infer<typeof authorSchema>
export type Book = z.infer<typeof bookSchema>
export type NewsItem = z.infer<typeof newsItemSchema>
export type Page = z.infer<typeof pageSchema>
export type { Theme } from './theme'
export type SiteContent = z.infer<typeof siteContentSchema>
