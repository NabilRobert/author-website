// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MAX_IMAGE_BYTES } from '../../shared/images'
import { MAX_IMAGES_PER_SITE, usedImageKeys } from '../../server/image-limits'
import { blockSchema } from '../../shared/blocks'
import { plainBox } from '../../shared/theme'
import { demoContent } from '../../shared/demo-content'
import { createTestApp } from './test-app'
import type { TestApp } from './test-app'

// The first bytes of real files of each type, padded out.
const PNG_START = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const JPEG_START = [0xff, 0xd8, 0xff, 0xe0]
const WEBP_START = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]

let api: TestApp
let cookie: string

beforeEach(async () => {
  api = await createTestApp()
  cookie = await api.signUp('mara@example.com', 'mara')
})
afterEach(async () => {
  await api.dispose()
})

function fileOf(start: number[], type: string, size = 1024, name = 'picture') {
  const bytes = new Uint8Array(size)
  bytes.set(start)
  return new File([bytes], name, { type })
}

function upload(file: File | null, loginCookie = cookie) {
  const form = new FormData()
  if (file) form.set('image', file)
  return api.request('/api/me/images', { method: 'POST', body: form }, loginCookie)
}

async function uploadedKey(file: File): Promise<string> {
  const response = await upload(file)
  expect(response.status).toBe(201)
  return ((await response.json()) as { key: string }).key
}

describe('POST /api/me/images', () => {
  it.each([
    ['PNG', PNG_START, 'image/png', 'png'],
    ['JPG', JPEG_START, 'image/jpeg', 'jpg'],
    ['WebP', WEBP_START, 'image/webp', 'webp'],
  ])('stores a %s under a fresh key', async (_name, start, type, extension) => {
    const key = await uploadedKey(fileOf(start, type))
    expect(key).toMatch(new RegExp(`^images/[0-9a-f-]{36}\\.${extension}$`))
  })

  it('refuses an SVG, which could carry script', async () => {
    const svg = new File(['<svg onload="alert(1)"/>'], 'x.svg', { type: 'image/svg+xml' })
    const response = await upload(svg)
    expect(response.status).toBe(415)
    expect(await response.json()).toEqual({ error: 'The picture must be a JPG, PNG or WebP file.' })
  })

  it('refuses a file that claims to be a JPG but is not one', async () => {
    const fake = new File(['<html>not a picture</html>'], 'x.jpg', { type: 'image/jpeg' })
    expect((await upload(fake)).status).toBe(415)
  })

  it('refuses a picture over 5 MB', async () => {
    const response = await upload(fileOf(PNG_START, 'image/png', MAX_IMAGE_BYTES + 1))
    expect(response.status).toBe(413)
  })

  it('asks for a picture when none was sent', async () => {
    const response = await upload(null)
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Choose a picture to upload.' })
  })

  it('refuses an upload without a login', async () => {
    expect((await upload(fileOf(PNG_START, 'image/png'), '')).status).toBe(401)
  })

  it('refuses an upload past the site picture limit', async () => {
    const site = await api.db.prepare("SELECT id FROM sites WHERE name = 'mara'").first<{ id: string }>()
    const rows = Array.from({ length: MAX_IMAGES_PER_SITE }, (_, index) =>
      api.db
        .prepare('INSERT INTO images (key, site_id, bytes, created_at) VALUES (?, ?, 10, ?)')
        .bind(`images/old-${index}.png`, site!.id, new Date().toISOString()),
    )
    await api.db.batch(rows)
    const response = await upload(fileOf(PNG_START, 'image/png'))
    expect(response.status).toBe(403)
    expect(((await response.json()) as { error: string }).error).toContain('the most it can hold')
  })
})

describe('GET /api/images/<name>', () => {
  it('serves an uploaded picture with its type and a long cache', async () => {
    const key = await uploadedKey(fileOf(PNG_START, 'image/png', 2048))
    const response = await api.request(`/api/${key}`)
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/png')
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable')
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect((await response.arrayBuffer()).byteLength).toBe(2048)
  })

  it('answers 404 for a picture that does not exist', async () => {
    const response = await api.request('/api/images/00000000-0000-4000-8000-000000000000.png')
    expect(response.status).toBe(404)
  })

  it('serves only picture names, not other files in the bucket', async () => {
    await api.env.IMAGES?.put('images/notes.html', '<script>alert(1)</script>')
    const response = await api.request('/api/images/notes.html')
    expect(response.status).toBe(404)
  })
})

describe('pictures nobody uses', () => {
  it('are deleted after a save once they are a day old, keeping the ones in use', async () => {
    const used = await uploadedKey(fileOf(PNG_START, 'image/png'))
    const unused = await uploadedKey(fileOf(PNG_START, 'image/png'))
    await api.db.prepare("UPDATE images SET created_at = '2000-01-01T00:00:00.000Z'").run()
    const profile = { ...demoContent.profile, photoKey: used }
    const init = {
      method: 'PUT',
      body: JSON.stringify({ ...demoContent, profile }),
      headers: { 'Content-Type': 'application/json' },
    }
    expect((await api.request('/api/me/content', init, cookie)).status).toBe(200)
    expect((await api.request(`/api/${used}`)).status).toBe(200)
    expect((await api.request(`/api/${unused}`)).status).toBe(404)
  })

  it('are all deleted with the account', async () => {
    const key = await uploadedKey(fileOf(PNG_START, 'image/png'))
    await api.request('/api/me', { method: 'DELETE' }, cookie)
    expect((await api.request(`/api/${key}`)).status).toBe(404)
  })
})

describe('which pictures are in use', () => {
  it("counts a gallery's pictures, on a page, a work's own page or a saved layout, so tidying up never deletes them", () => {
    const key = 'images/0b8e2f4c-3a1d-4c6b-8e7f-2d9a5c1b3e01.jpg'
    const gallery = blockSchema.parse({
      id: demoContent.works[0]!.id,
      style: plainBox(),
      type: 'gallery',
      heading: '',
      pictures: [{ imageKey: key, description: '' }],
      columns: 3,
      imageShape: 'square',
    })
    const content = { ...demoContent, pages: [{ ...demoContent.pages[0]!, blocks: [gallery] }] }
    expect(usedImageKeys(content).has(key)).toBe(true)
    const onWorkPage = { ...demoContent, works: [{ ...demoContent.works[0]!, pageBlocks: [gallery] }] }
    expect(usedImageKeys(onWorkPage).has(key)).toBe(true)
    const inLayout = { ...demoContent, savedLayouts: [{ id: crypto.randomUUID(), name: 'Mine', blocks: [gallery] }] }
    expect(usedImageKeys(inLayout).has(key)).toBe(true)
  })
})

describe('without picture storage (no IMAGES binding)', () => {
  beforeEach(() => {
    delete api.env.IMAGES
  })

  it('tells the editor that uploads are off', async () => {
    expect(await (await api.request('/api/features')).json()).toEqual({ uploads: false })
  })

  it('refuses picture and file uploads with a clear message, storing nothing', async () => {
    const response = await upload(fileOf(PNG_START, 'image/png'))
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: 'Uploading pictures and files is switched off for now.' })
    const form = new FormData()
    form.set('file', new File(['%PDF-1.7'], 'cv.pdf', { type: 'application/pdf' }))
    expect((await api.request('/api/me/files', { method: 'POST', body: form }, cookie)).status).toBe(503)
    const rows = await api.db.prepare('SELECT COUNT(*) AS count FROM images').first<{ count: number }>()
    expect(rows?.count).toBe(0)
  })

  it('still saves the site and deletes accounts', async () => {
    const saved = await api.request(
      '/api/me/content',
      { method: 'PUT', body: JSON.stringify(demoContent), headers: { 'Content-Type': 'application/json' } },
      cookie,
    )
    expect(saved.status).toBe(200)
    expect((await api.request('/api/me', { method: 'DELETE' }, cookie)).ok).toBe(true)
  })
})
