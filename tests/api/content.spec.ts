// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { app } from '../../server/app'
import { loadContent } from '../../server/content-read'
import { saveContent, StaleSaveError } from '../../server/content-write'
import { demoContent } from '../../shared/demo-content'
import { createTestDatabase } from './test-database'

const SAVED_AT = new Date('2026-11-09T10:00:00Z')

let db: D1Database
let dispose: () => Promise<void>

beforeEach(async () => {
  ;({ db, dispose } = await createTestDatabase())
})
afterEach(async () => {
  await dispose()
})

function getContent() {
  return app.request('/api/content', {}, { DB: db })
}

describe('content store', () => {
  it('reads back exactly what was saved, in the same order', async () => {
    const saved = await saveContent(db, demoContent, SAVED_AT)
    expect(await loadContent(db)).toEqual(saved)
    expect(saved.updatedAt).toBe('2026-11-09T10:00:00.000Z')
  })

  it('has nothing to read before the first save', async () => {
    expect(await loadContent(db)).toBeNull()
  })

  it('refuses a save made from an older copy', async () => {
    await saveContent(db, demoContent, SAVED_AT)
    // demoContent still has updatedAt '', from before the first save.
    await expect(saveContent(db, demoContent, new Date())).rejects.toBeInstanceOf(StaleSaveError)
  })

  it('accepts a save made from the latest copy and removes what was deleted', async () => {
    const first = await saveContent(db, demoContent, SAVED_AT)
    const withoutNews = { ...first, news: [], books: first.books.slice(0, 1) }
    await saveContent(db, withoutNews, new Date('2026-11-09T11:00:00Z'))
    const stored = await loadContent(db)
    expect(stored?.news).toEqual([])
    expect(stored?.books.map((book) => book.title)).toEqual(['The Lantern Year'])
  })

  it('keeps unicode text intact', async () => {
    const author = { ...demoContent.author, name: 'Sári Đặng 张伟 — “quoted”' }
    await saveContent(db, { ...demoContent, author }, SAVED_AT)
    expect((await loadContent(db))?.author.name).toBe('Sári Đặng 张伟 — “quoted”')
  })

  it('still loads a block saved before a newer field existed', async () => {
    await saveContent(db, demoContent, SAVED_AT)
    await db
      .prepare(
        "UPDATE blocks SET fields_json = json_remove(fields_json, '$.imageDescription') WHERE type = 'imageText'",
      )
      .run()
    const about = (await loadContent(db))?.pages.find((page) => page.slug === 'about')
    expect(about?.blocks[0]).toMatchObject({ type: 'imageText', imageDescription: '' })
  })

  it('leaves the old content when a save fails part-way', async () => {
    const first = await saveContent(db, demoContent, SAVED_AT)
    // Two books with one id break the books table's primary key mid-batch.
    const broken = { ...first, books: [first.books[0]!, first.books[0]!] }
    await expect(saveContent(db, broken, new Date())).rejects.toThrow()
    expect(await loadContent(db)).toEqual(first)
  })
})

describe('GET /api/content', () => {
  it('returns the site with a one-minute public cache', async () => {
    await saveContent(db, demoContent, SAVED_AT)
    const response = await getContent()
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=60')
    expect(((await response.json()) as { author: { name: string } }).author.name).toBe('Mara Ellison')
  })

  it('says how to set the site up when it is empty', async () => {
    const response = await getContent()
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'This site has no content yet. Open /edit to set it up.' })
  })

  it('answers a stored row that breaks the schema with a plain 500, not the details', async () => {
    await saveContent(db, demoContent, SAVED_AT)
    await db.prepare("UPDATE books SET cover_key = '../../etc/passwd'").run()
    const response = await getContent()
    expect(response.status).toBe(500)
    expect(JSON.stringify(await response.json())).not.toContain('passwd')
  })

  it('answers an unknown API address with a 404 that names it', async () => {
    const response = await app.request('/api/nothing-here', {}, { DB: db })
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'There is no API address GET /api/nothing-here.' })
  })
})
