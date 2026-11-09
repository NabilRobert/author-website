/**
 * The site's content as one document: the profile's details, the works, the
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
  imageCrop,
  imageKey,
  itemId,
  linkSchema,
  longText,
  optionalWebAddress,
  requiredText,
  shortText,
  webAddress,
} from './fields'

/** Caps that keep one save small; far above what an profile site needs. */
export const MAX_PAGES = 30
export const MAX_BLOCKS_PER_PAGE = 40

// Addresses the site itself uses, so a page cannot take them.
const RESERVED_SLUGS = new Set(['edit', 'api'])
// The last part of an address, like "about" in /alex/about.
const addressPart = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lower-case letters, numbers and dashes, like "my-works".')
const blocksSchema = z
  .array(blockSchema)
  .max(MAX_BLOCKS_PER_PAGE, `A page can hold up to ${MAX_BLOCKS_PER_PAGE} blocks.`)

export const quoteSchema = z.object({
  quote: longText.min(1, 'Add the quote.'),
  source: requiredText('Say who said it, like a client, a reviewer or a magazine.'),
})

export const profileSchema = z.object({
  name: requiredText('Add your name.'),
  // Used by the press kit and as the site's description in search results.
  bioShort: longText,
  // The headshot offered in the press kit.
  photoKey: imageKey,
  photoCrop: imageCrop,
  contactEmail: z.union([z.literal(''), z.email('Enter an email address like name@example.com.')]),
  newsletterUrl: optionalWebAddress,
  socialLinks: z.array(linkSchema.extend({ url: webAddress })),
})

export const workSchema = z.object({
  id: itemId,
  title: requiredText('Add a title.'),
  // A line under the title, like "House, Jakarta" or "Novel".
  subtitle: shortText,
  // Works with the same group (a series, collection or client) that sit
  // next to each other share a heading. Empty for none.
  group: shortText,
  // Optional; the "newest" choice of a works block uses it.
  date: z.union([z.literal(''), calendarDate]),
  description: longText,
  imageKey,
  imageCrop,
  // Like where to buy it, the live site, a video or the source code.
  links: z.array(linkSchema.extend({ url: webAddress })),
  quotes: z.array(quoteSchema),
  // The work's own page, at /<name>/work/<pageSlug>, with these blocks below
  // its details; '' for none. Added after the first saves, hence the defaults.
  pageSlug: z.union([z.literal(''), addressPart]).default(''),
  pageBlocks: blocksSchema.default([]),
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
  // The page's address: '' is the front page, 'works' is /works.
  slug: z.union([
    z.literal(''),
    addressPart.refine((slug) => !RESERVED_SLUGS.has(slug), 'That address is used by the site itself. Pick another.'),
  ]),
  title: requiredText('Give the page a name.'),
  showInMenu: z.boolean(),
  blocks: blocksSchema,
})

export const siteContentSchema = z
  .object({
    profile: profileSchema,
    theme: themeSchema,
    // Works and news in the order the owner arranged them.
    works: z.array(workSchema),
    news: z.array(newsItemSchema),
    // Pages in menu order.
    pages: z.array(pageSchema).max(MAX_PAGES, `The site can have up to ${MAX_PAGES} pages.`),
    // When the content was last saved; the API refuses a save made from an
    // older copy, so a forgotten tab cannot undo newer changes.
    updatedAt: z.string(),
  })
  .superRefine(checkPageAddresses)
  .superRefine(checkWorkPageAddresses)

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

/** No two works' own pages at the same address. */
function checkWorkPageAddresses(content: { works: { pageSlug: string }[] }, context: z.RefinementCtx) {
  const slugs = content.works.map((work) => work.pageSlug).filter(Boolean)
  const duplicate = slugs.find((slug, index) => slugs.indexOf(slug) !== index)
  if (duplicate !== undefined) {
    context.addIssue({
      code: 'custom',
      path: ['works'],
      message: `Two works' pages use /work/${duplicate}. Change one.`,
    })
  }
}

export type { Link } from './fields'
export type Quote = z.infer<typeof quoteSchema>
export type Profile = z.infer<typeof profileSchema>
export type Work = z.infer<typeof workSchema>
export type NewsItem = z.infer<typeof newsItemSchema>
export type Page = z.infer<typeof pageSchema>
export type { Theme } from './theme'
export type SiteContent = z.infer<typeof siteContentSchema>
