/**
 * Reads one site's content from D1 and puts it back together as one
 * document (shared/schema.ts: SiteContent). Every query is limited to that
 * site's rows.
 *
 * All the selects go in one D1 batch: one round trip, and every table is
 * read from the same moment.
 */
import { siteContentSchema } from '../shared/schema'
import type { Block } from '../shared/blocks'
import { uniqueSlug } from '../shared/addresses'
import type { Work, NewsItem, Page, SiteContent } from '../shared/schema'
import { centredCrop } from '../shared/fields'
import type { ImageCrop } from '../shared/fields'

interface ProfileRow {
  name: string
  bio_short: string
  photo_key: string | null
  photo_crop: string | null
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
  work_shape: string
  panel: string | null
  pattern_colours: string | null
  background_image_key: string | null
}
interface LinkRow {
  label: string
  url: string
}
interface WorkRow {
  id: string
  title: string
  group_name: string
  subtitle: string
  dated_on: string
  description: string
  image_key: string | null
  image_crop: string | null
  page_slug: string
  show_page: number
}
interface WorkPictureRow {
  work_id: string
  image_key: string
  image_crop: string | null
  description: string
}
interface WorkLinkRow extends LinkRow {
  work_id: string
}
interface QuoteRow {
  work_id: string
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
export async function loadContent(db: D1Database, siteId: string): Promise<SiteContent | null> {
  const [profile, theme, socialLinks, works, links, quotes, pictures, news, pages, blocks, layouts] = await readRows(
    db,
    siteId,
  )
  const profileRow = rowsOf<ProfileRow>(profile)[0]
  if (!profileRow) return null

  const document = {
    profile: {
      name: profileRow.name,
      bioShort: profileRow.bio_short,
      photoKey: profileRow.photo_key,
      photoCrop: readCrop(profileRow.photo_crop),
      contactEmail: profileRow.contact_email,
      newsletterUrl: profileRow.newsletter_url,
      socialLinks: rowsOf<LinkRow>(socialLinks),
    },
    theme: toTheme(rowsOf<ThemeRow>(theme)[0]),
    works: assembleWorks({
      works: rowsOf(works),
      links: rowsOf(links),
      quotes: rowsOf(quotes),
      pictures: rowsOf(pictures),
      blocks: rowsOf(blocks),
    }),
    news: rowsOf<NewsRow>(news).map(toNewsItem),
    pages: assemblePages(rowsOf(pages), rowsOf(blocks)),
    savedLayouts: rowsOf<{ id: string; name: string }>(layouts).map((row) => ({
      ...row,
      blocks: blocksOf(rowsOf(blocks), row.id),
    })),
    updatedAt: profileRow.updated_at,
  }
  return parseStored(document)
}

// Every table of the site, in one batch, in the order loadContent unpacks them.
function readRows(db: D1Database, siteId: string) {
  const query = (sql: string) => db.prepare(sql).bind(siteId)
  return db.batch([
    query('SELECT * FROM profile WHERE site_id = ?'),
    query('SELECT * FROM theme WHERE site_id = ?'),
    query('SELECT label, url FROM social_links WHERE site_id = ? ORDER BY position'),
    query('SELECT * FROM works WHERE site_id = ? ORDER BY position'),
    query('SELECT work_id, label, url FROM work_links WHERE site_id = ? ORDER BY work_id, position'),
    query('SELECT work_id, quote, source FROM work_quotes WHERE site_id = ? ORDER BY work_id, position'),
    query('SELECT * FROM work_pictures WHERE site_id = ? ORDER BY work_id, position'),
    query('SELECT * FROM news WHERE site_id = ? ORDER BY position'),
    query('SELECT * FROM pages WHERE site_id = ? ORDER BY position'),
    query('SELECT page_id, id, type, fields_json FROM blocks WHERE site_id = ? ORDER BY page_id, position'),
    query('SELECT id, name FROM saved_layouts WHERE site_id = ? ORDER BY position'),
  ])
}

// Stored as JSON; NULL (saved before cropping existed) means centred. The
// schema check of the whole document validates the shape.
function readCrop(json: string | null): ImageCrop {
  return json ? (JSON.parse(json) as ImageCrop) : centredCrop()
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
    workShape: row.work_shape,
    // JSON, or NULL (saved before the setting existed) for the schema default.
    panel: row.panel ? (JSON.parse(row.panel) as unknown) : undefined,
    // JSON, or NULL (saved before pattern colours existed) for the schema default.
    patternColours: row.pattern_colours ? (JSON.parse(row.pattern_colours) as unknown) : undefined,
    backgroundImageKey: row.background_image_key,
  }
}

interface WorkRows {
  works: WorkRow[]
  links: WorkLinkRow[]
  quotes: QuoteRow[]
  pictures: WorkPictureRow[]
  blocks: BlockRow[]
}

function assembleWorks({ works, links, quotes, pictures, blocks }: WorkRows): Work[] {
  const assembled = works.map((row) => ({
    id: row.id,
    title: row.title,
    group: row.group_name,
    subtitle: row.subtitle,
    date: row.dated_on,
    description: row.description,
    imageKey: row.image_key,
    imageCrop: readCrop(row.image_crop),
    links: links.filter((link) => link.work_id === row.id).map(({ label, url }) => ({ label, url })),
    quotes: quotes.filter((quote) => quote.work_id === row.id).map(({ quote, source }) => ({ quote, source })),
    pageSlug: row.page_slug,
    showPage: row.show_page === 1,
    morePictures: pictures
      .filter((picture) => picture.work_id === row.id)
      .map((picture) => ({
        imageKey: picture.image_key,
        imageCrop: readCrop(picture.image_crop),
        description: picture.description,
      })),
    pageBlocks: blocksOf(blocks, row.id),
  }))
  return withAddresses(assembled)
}

// Works saved before every work had a page have no address (''): give
// each one from its title, as the editor would, until the owner saves.
function withAddresses(works: Work[]): Work[] {
  const taken = works.map((work) => work.pageSlug).filter(Boolean)
  return works.map((work) => {
    if (work.pageSlug) return work
    const pageSlug = uniqueSlug(work.title, taken, 'work')
    taken.push(pageSlug)
    return { ...work, pageSlug }
  })
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
    blocks: blocksOf(blocks, row.id),
  }))
}

// The blocks of one page, of one work's own page, or of a saved layout
// (stored with the work's or layout's id as page_id). Checked against the block schema with the rest of the document.
function blocksOf(blocks: BlockRow[], ownerId: string): Block[] {
  return blocks
    .filter((block) => block.page_id === ownerId)
    .map((block) => ({ ...JSON.parse(block.fields_json), id: block.id, type: block.type }) as Block)
}

function parseStored(document: unknown): SiteContent {
  const result = siteContentSchema.safeParse(document)
  if (!result.success) {
    throw new StoredContentError(`Stored content does not match the schema: ${result.error.message}`)
  }
  return result.data
}
