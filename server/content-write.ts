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
import type { Work, NewsItem, Page, SavedLayout, SiteContent, Theme } from '../shared/schema'
import type { Block } from '../shared/blocks'

/** Prepares a statement with the site's id bound as its first value. */
type Insert = (sql: string, ...values: unknown[]) => D1PreparedStatement

/** Thrown when the save was made from an older copy of the content. */
export class StaleSaveError extends Error {}

// Children before parents, so foreign keys never point at a deleted row.
export const SITE_CONTENT_TABLES = [
  'blocks',
  'saved_layouts',
  'pages',
  'news',
  'work_pictures',
  'work_quotes',
  'work_links',
  'works',
  'social_links',
  'theme',
  'profile',
]

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
    .prepare('SELECT updated_at FROM profile WHERE site_id = ?')
    .bind(siteId)
    .first<{ updated_at: string }>()
  if ((stored?.updated_at ?? '') !== content.updatedAt) {
    throw new StaleSaveError('The site was changed somewhere else since this editor was opened.')
  }
  const saved = { ...content, updatedAt: now.toISOString() }
  // Every statement gets the site's id first, so the rows are always this site's.
  const insert = (sql: string, ...values: unknown[]) => db.prepare(sql).bind(siteId, ...values)
  await db.batch([
    ...SITE_CONTENT_TABLES.map((table) => insert(`DELETE FROM ${table} WHERE site_id = ?`)),
    ...profileStatements(insert, saved),
    themeStatement(insert, saved.theme),
    ...saved.works.flatMap((work, position) => workStatements(insert, work, position)),
    ...saved.news.map((item, position) => newsStatement(insert, item, position)),
    ...saved.pages.flatMap((page, position) => pageStatements(insert, page, position)),
    ...saved.savedLayouts.flatMap((layout, position) => savedLayoutStatements(insert, layout, position)),
  ])
  return saved
}

function profileStatements(insert: Insert, content: SiteContent): D1PreparedStatement[] {
  const { profile } = content
  const profileRow = insert(
    `INSERT INTO profile (site_id, name, bio_short, photo_key, photo_crop, contact_email, newsletter_url, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    profile.name,
    profile.bioShort,
    profile.photoKey,
    JSON.stringify(profile.photoCrop),
    profile.contactEmail,
    profile.newsletterUrl,
    content.updatedAt,
  )
  const links = profile.socialLinks.map((link, position) =>
    insert(
      'INSERT INTO social_links (site_id, position, label, url) VALUES (?, ?, ?, ?)',
      position,
      link.label,
      link.url,
    ),
  )
  return [profileRow, ...links]
}

function themeStatement(insert: Insert, theme: Theme): D1PreparedStatement {
  return insert(
    `INSERT INTO theme (site_id, background_colour, text_colour, accent_colour, button_colour, button_text_colour,
       heading_font, body_font, background_pattern, pattern_colours, work_shape, background_image_key, panel)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    theme.backgroundColour,
    theme.textColour,
    theme.accentColour,
    theme.buttonColour,
    theme.buttonTextColour,
    theme.headingFont,
    theme.bodyFont,
    theme.backgroundPattern,
    JSON.stringify(theme.patternColours),
    theme.workShape,
    theme.backgroundImageKey,
    JSON.stringify(theme.panel),
  )
}

function workStatements(insert: Insert, work: Work, position: number): D1PreparedStatement[] {
  return [
    workRowStatement(insert, work, position),
    ...workDetailStatements(insert, work),
    ...blockStatements(insert, work.id, work.pageBlocks),
  ]
}

function workRowStatement(insert: Insert, work: Work, position: number): D1PreparedStatement {
  return insert(
    `INSERT INTO works (site_id, id, position, title, subtitle, group_name, dated_on, description,
       image_key, image_crop, page_slug, show_page)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    work.id,
    position,
    work.title,
    work.subtitle,
    work.group,
    work.date,
    work.description,
    work.imageKey,
    JSON.stringify(work.imageCrop),
    work.pageSlug,
    work.showPage ? 1 : 0,
  )
}

// A work's links, quotes and more pictures, each in its own table.
function workDetailStatements(insert: Insert, work: Work): D1PreparedStatement[] {
  const links = work.links.map((link, linkPosition) =>
    insert(
      'INSERT INTO work_links (site_id, work_id, position, label, url) VALUES (?, ?, ?, ?, ?)',
      work.id,
      linkPosition,
      link.label,
      link.url,
    ),
  )
  const quotes = work.quotes.map((quote, reviewPosition) =>
    insert(
      'INSERT INTO work_quotes (site_id, work_id, position, quote, source) VALUES (?, ?, ?, ?, ?)',
      work.id,
      reviewPosition,
      quote.quote,
      quote.source,
    ),
  )
  const pictures = work.morePictures.map((picture, picturePosition) =>
    insert(
      `INSERT INTO work_pictures (site_id, work_id, position, image_key, image_crop, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      work.id,
      picturePosition,
      picture.imageKey,
      JSON.stringify(picture.imageCrop),
      picture.description,
    ),
  )
  return [...links, ...quotes, ...pictures]
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
  return [pageRow, ...blockStatements(insert, page.id, page.blocks)]
}

function savedLayoutStatements(insert: Insert, layout: SavedLayout, position: number): D1PreparedStatement[] {
  const layoutRow = insert(
    'INSERT INTO saved_layouts (site_id, id, position, name) VALUES (?, ?, ?, ?)',
    layout.id,
    position,
    layout.name,
  )
  return [layoutRow, ...blockStatements(insert, layout.id, layout.blocks)]
}

// A page's blocks, or a work's own page's, or a saved layout's: `ownerId` is its id.
function blockStatements(insert: Insert, ownerId: string, blocks: Block[]): D1PreparedStatement[] {
  return blocks.map((block, position) => {
    const { id, type, ...fields } = block
    return insert(
      'INSERT INTO blocks (site_id, id, page_id, position, type, fields_json) VALUES (?, ?, ?, ?, ?, ?)',
      id,
      ownerId,
      position,
      type,
      JSON.stringify(fields),
    )
  })
}
