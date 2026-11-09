/**
 * Reads the site's content from D1 and puts it back together as one
 * document (shared/schema.ts: SiteContent).
 *
 * All the selects go in one D1 batch: one round trip, and every table is
 * read from the same moment.
 */
import { siteContentSchema } from '../shared/schema'
import type { Book, NewsItem, Page, SiteContent } from '../shared/schema'

interface AuthorRow {
  name: string
  bio_short: string
  photo_key: string | null
  contact_email: string
  newsletter_url: string
  updated_at: string
}
interface ThemeRow {
  background_colour: string
  text_colour: string
  accent_colour: string
  button_colour: string
  button_text_colour: string
  heading_font: string
  body_font: string
  background_pattern: string
  background_image_key: string | null
}
interface LinkRow {
  label: string
  url: string
}
interface BookRow {
  id: string
  title: string
  series_name: string
  series_position: number | null
  published_on: string
  blurb: string
  cover_key: string | null
}
interface BookLinkRow extends LinkRow {
  book_id: string
}
interface ReviewRow {
  book_id: string
  quote: string
  source: string
}
interface NewsRow {
  id: string
  kind: NewsItem['kind']
  title: string
  body: string
  happens_on: string
  place: string
  link_url: string
}
interface PageRow {
  id: string
  slug: string
  title: string
  show_in_menu: number
}
interface BlockRow {
  page_id: string
  id: string
  type: string
  fields_json: string
}

/** Thrown when the stored content no longer matches the schema. */
export class StoredContentError extends Error {}

/**
 * The whole site, or null if nothing has been saved yet (a new database).
 * Checks the result against the schema, so a bad row is caught here rather
 * than breaking a page.
 */
export async function loadContent(db: D1Database): Promise<SiteContent | null> {
  const [author, theme, socialLinks, books, buyLinks, reviews, news, pages, blocks] = await db.batch([
    db.prepare('SELECT * FROM author WHERE id = 1'),
    db.prepare('SELECT * FROM theme WHERE id = 1'),
    db.prepare('SELECT label, url FROM social_links ORDER BY position'),
    db.prepare('SELECT * FROM books ORDER BY position'),
    db.prepare('SELECT book_id, label, url FROM buy_links ORDER BY book_id, position'),
    db.prepare('SELECT book_id, quote, source FROM reviews ORDER BY book_id, position'),
    db.prepare('SELECT * FROM news ORDER BY position'),
    db.prepare('SELECT * FROM pages ORDER BY position'),
    db.prepare('SELECT page_id, id, type, fields_json FROM blocks ORDER BY page_id, position'),
  ])
  const authorRow = rowsOf<AuthorRow>(author)[0]
  if (!authorRow) return null

  const document = {
    author: {
      name: authorRow.name,
      bioShort: authorRow.bio_short,
      photoKey: authorRow.photo_key,
      contactEmail: authorRow.contact_email,
      newsletterUrl: authorRow.newsletter_url,
      socialLinks: rowsOf<LinkRow>(socialLinks),
    },
    theme: toTheme(rowsOf<ThemeRow>(theme)[0]),
    books: assembleBooks(rowsOf(books), rowsOf(buyLinks), rowsOf(reviews)),
    news: rowsOf<NewsRow>(news).map(toNewsItem),
    pages: assemblePages(rowsOf(pages), rowsOf(blocks)),
    updatedAt: authorRow.updated_at,
  }
  return parseStored(document)
}

function rowsOf<Row>(result: D1Result | undefined): Row[] {
  return (result?.results ?? []) as Row[]
}

// Font names are checked against the list on offer by the schema.
function toTheme(row: ThemeRow | undefined) {
  if (!row) return undefined
  return {
    backgroundColour: row.background_colour,
    textColour: row.text_colour,
    accentColour: row.accent_colour,
    buttonColour: row.button_colour,
    buttonTextColour: row.button_text_colour,
    headingFont: row.heading_font,
    bodyFont: row.body_font,
    backgroundPattern: row.background_pattern,
    backgroundImageKey: row.background_image_key,
  }
}

function assembleBooks(books: BookRow[], buyLinks: BookLinkRow[], reviews: ReviewRow[]): Book[] {
  return books.map((row) => ({
    id: row.id,
    title: row.title,
    seriesName: row.series_name,
    seriesPosition: row.series_position,
    publishedOn: row.published_on,
    blurb: row.blurb,
    coverKey: row.cover_key,
    buyLinks: buyLinks.filter((link) => link.book_id === row.id).map(({ label, url }) => ({ label, url })),
    reviews: reviews.filter((review) => review.book_id === row.id).map(({ quote, source }) => ({ quote, source })),
  }))
}

function toNewsItem(row: NewsRow): NewsItem {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    happensOn: row.happens_on,
    place: row.place,
    linkUrl: row.link_url,
  }
}

function assemblePages(pages: PageRow[], blocks: BlockRow[]): Page[] {
  return pages.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    showInMenu: row.show_in_menu === 1,
    // Checked against the block schema with the rest of the document.
    blocks: blocks
      .filter((block) => block.page_id === row.id)
      .map((block) => ({ ...JSON.parse(block.fields_json), id: block.id, type: block.type })),
  }))
}

function parseStored(document: unknown): SiteContent {
  const result = siteContentSchema.safeParse(document)
  if (!result.success) {
    throw new StoredContentError(`Stored content does not match the schema: ${result.error.message}`)
  }
  return result.data
}
