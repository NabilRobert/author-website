/**
 * Saves the whole site: deletes every content row and inserts the new ones,
 * in one D1 batch. D1 runs a batch as one transaction, so a failed save
 * leaves the old content untouched.
 *
 * Replacing everything is simpler than working out what changed, and the
 * site is small: a save writes about 50 to 150 rows, against the free
 * plan's 100,000 a day.
 */
import type { Book, NewsItem, Page, SiteContent, Theme } from '../shared/schema'

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
export async function saveContent(db: D1Database, content: SiteContent, now: Date): Promise<SiteContent> {
  const stored = await db.prepare('SELECT updated_at FROM author WHERE id = 1').first<{ updated_at: string }>()
  if ((stored?.updated_at ?? '') !== content.updatedAt) {
    throw new StaleSaveError('The site was changed somewhere else since this editor was opened.')
  }
  const saved = { ...content, updatedAt: now.toISOString() }
  await db.batch([
    ...TABLES_TO_CLEAR.map((table) => db.prepare(`DELETE FROM ${table}`)),
    ...authorStatements(db, saved),
    themeStatement(db, saved.theme),
    ...saved.books.flatMap((book, position) => bookStatements(db, book, position)),
    ...saved.news.map((item, position) => newsStatement(db, item, position)),
    ...saved.pages.flatMap((page, position) => pageStatements(db, page, position)),
  ])
  return saved
}

function authorStatements(db: D1Database, content: SiteContent): D1PreparedStatement[] {
  const { author } = content
  const authorRow = db
    .prepare(
      `INSERT INTO author (id, name, bio_short, photo_key, photo_crop, contact_email, newsletter_url, updated_at)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      author.name,
      author.bioShort,
      author.photoKey,
      JSON.stringify(author.photoCrop),
      author.contactEmail,
      author.newsletterUrl,
      content.updatedAt,
    )
  const links = author.socialLinks.map((link, position) =>
    db.prepare('INSERT INTO social_links (position, label, url) VALUES (?, ?, ?)').bind(position, link.label, link.url),
  )
  return [authorRow, ...links]
}

function themeStatement(db: D1Database, theme: Theme): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO theme (id, background_colour, text_colour, accent_colour, button_colour, button_text_colour,
         heading_font, body_font, background_pattern, background_image_key)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      theme.backgroundColour,
      theme.textColour,
      theme.accentColour,
      theme.buttonColour,
      theme.buttonTextColour,
      theme.headingFont,
      theme.bodyFont,
      theme.backgroundPattern,
      theme.backgroundImageKey,
    )
}

function bookStatements(db: D1Database, book: Book, position: number): D1PreparedStatement[] {
  const bookRow = db
    .prepare(
      `INSERT INTO books (id, position, title, series_name, series_position, published_on, blurb, cover_key, cover_crop)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
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
    db
      .prepare('INSERT INTO buy_links (book_id, position, label, url) VALUES (?, ?, ?, ?)')
      .bind(book.id, linkPosition, link.label, link.url),
  )
  const reviews = book.reviews.map((review, reviewPosition) =>
    db
      .prepare('INSERT INTO reviews (book_id, position, quote, source) VALUES (?, ?, ?, ?)')
      .bind(book.id, reviewPosition, review.quote, review.source),
  )
  return [bookRow, ...links, ...reviews]
}

function newsStatement(db: D1Database, item: NewsItem, position: number): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO news (id, position, kind, title, body, happens_on, place, link_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(item.id, position, item.kind, item.title, item.body, item.happensOn, item.place, item.linkUrl)
}

function pageStatements(db: D1Database, page: Page, position: number): D1PreparedStatement[] {
  const pageRow = db
    .prepare('INSERT INTO pages (id, position, slug, title, show_in_menu) VALUES (?, ?, ?, ?, ?)')
    .bind(page.id, position, page.slug, page.title, page.showInMenu ? 1 : 0)
  const blocks = page.blocks.map((block, blockPosition) => {
    const { id, type, ...fields } = block
    return db
      .prepare('INSERT INTO blocks (id, page_id, position, type, fields_json) VALUES (?, ?, ?, ?, ?)')
      .bind(id, page.id, blockPosition, type, JSON.stringify(fields))
  })
  return [pageRow, ...blocks]
}
