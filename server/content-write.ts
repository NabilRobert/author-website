/**
 * Saves one whole site: deletes that site's content rows and inserts the
 * new ones,
 * in one D1 batch. D1 runs a batch as one transaction, so a failed save
 * leaves the old content untouched.
 *
 * Replacing everything is simpler than working out what changed, and the
 * site is small: a save writes about 50 to 150 rows, against the free
 * plan's 100,000 a day.
 */
import type { Book, NewsItem, Page, SiteContent, Theme } from '../shared/schema'

/** Prepares a statement with the site's id bound as its first value. */
type Insert = (sql: string, ...values: unknown[]) => D1PreparedStatement

/** Thrown when the save was made from an older copy of the content. */
export class StaleSaveError extends Error {}

// Children before parents, so foreign keys never point at a deleted row.
const TABLES_TO_CLEAR = ['blocks', 'pages', 'news', 'reviews', 'buy_links', 'books', 'social_links', 'theme', 'author']

/**
 * Replaces the stored content with `content` and returns it with its new
 * `updatedAt`. Refuses (StaleSaveError) if the stored content has changed
 * since the editor loaded it, so an old tab cannot undo newer work.
 *
 * The check and the write are two steps, not one transaction. With one
 * owner editing, the gap (milliseconds) is an accepted risk.
 */
export async function saveContent(
  db: D1Database,
  siteId: string,
  content: SiteContent,
  now: Date,
): Promise<SiteContent> {
  const stored = await db
    .prepare('SELECT updated_at FROM author WHERE site_id = ?')
    .bind(siteId)
    .first<{ updated_at: string }>()
  if ((stored?.updated_at ?? '') !== content.updatedAt) {
    throw new StaleSaveError('The site was changed somewhere else since this editor was opened.')
  }
  const saved = { ...content, updatedAt: now.toISOString() }
  // Every statement gets the site's id first, so the rows are always this site's.
  const insert = (sql: string, ...values: unknown[]) => db.prepare(sql).bind(siteId, ...values)
  await db.batch([
    ...TABLES_TO_CLEAR.map((table) => insert(`DELETE FROM ${table} WHERE site_id = ?`)),
    ...authorStatements(insert, saved),
    themeStatement(insert, saved.theme),
    ...saved.books.flatMap((book, position) => bookStatements(insert, book, position)),
    ...saved.news.map((item, position) => newsStatement(insert, item, position)),
    ...saved.pages.flatMap((page, position) => pageStatements(insert, page, position)),
  ])
  return saved
}

function authorStatements(insert: Insert, content: SiteContent): D1PreparedStatement[] {
  const { author } = content
  const authorRow = insert(
    `INSERT INTO author (site_id, name, bio_short, photo_key, photo_crop, contact_email, newsletter_url, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    author.name,
    author.bioShort,
    author.photoKey,
    JSON.stringify(author.photoCrop),
    author.contactEmail,
    author.newsletterUrl,
    content.updatedAt,
  )
  const links = author.socialLinks.map((link, position) =>
    insert(
      'INSERT INTO social_links (site_id, position, label, url) VALUES (?, ?, ?, ?)',
      position,
      link.label,
      link.url,
    ),
  )
  return [authorRow, ...links]
}

function themeStatement(insert: Insert, theme: Theme): D1PreparedStatement {
  return insert(
    `INSERT INTO theme (site_id, background_colour, text_colour, accent_colour, button_colour, button_text_colour,
       heading_font, body_font, background_pattern, pattern_colours, background_image_key)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    theme.backgroundColour,
    theme.textColour,
    theme.accentColour,
    theme.buttonColour,
    theme.buttonTextColour,
    theme.headingFont,
    theme.bodyFont,
    theme.backgroundPattern,
    JSON.stringify(theme.patternColours),
    theme.backgroundImageKey,
  )
}

function bookStatements(insert: Insert, book: Book, position: number): D1PreparedStatement[] {
  const bookRow = insert(
    `INSERT INTO books (site_id, id, position, title, series_name, series_position, published_on, blurb,
       cover_key, cover_crop)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    book.id,
    position,
    book.title,
    book.seriesName,
    book.seriesPosition,
    book.publishedOn,
    book.blurb,
    book.coverKey,
    JSON.stringify(book.coverCrop),
  )
  const links = book.buyLinks.map((link, linkPosition) =>
    insert(
      'INSERT INTO buy_links (site_id, book_id, position, label, url) VALUES (?, ?, ?, ?, ?)',
      book.id,
      linkPosition,
      link.label,
      link.url,
    ),
  )
  const reviews = book.reviews.map((review, reviewPosition) =>
    insert(
      'INSERT INTO reviews (site_id, book_id, position, quote, source) VALUES (?, ?, ?, ?, ?)',
      book.id,
      reviewPosition,
      review.quote,
      review.source,
    ),
  )
  return [bookRow, ...links, ...reviews]
}

function newsStatement(insert: Insert, item: NewsItem, position: number): D1PreparedStatement {
  return insert(
    `INSERT INTO news (site_id, id, position, kind, title, body, happens_on, place, link_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    item.id,
    position,
    item.kind,
    item.title,
    item.body,
    item.happensOn,
    item.place,
    item.linkUrl,
  )
}

function pageStatements(insert: Insert, page: Page, position: number): D1PreparedStatement[] {
  const pageRow = insert(
    'INSERT INTO pages (site_id, id, position, slug, title, show_in_menu) VALUES (?, ?, ?, ?, ?, ?)',
    page.id,
    position,
    page.slug,
    page.title,
    page.showInMenu ? 1 : 0,
  )
  const blocks = page.blocks.map((block, blockPosition) => {
    const { id, type, ...fields } = block
    return insert(
      'INSERT INTO blocks (site_id, id, page_id, position, type, fields_json) VALUES (?, ?, ?, ?, ?, ?)',
      id,
      page.id,
      blockPosition,
      type,
      JSON.stringify(fields),
    )
  })
  return [pageRow, ...blocks]
}
