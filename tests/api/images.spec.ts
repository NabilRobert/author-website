// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { app } from '../../server/app'
import type { Env } from '../../server/env'
import { MAX_IMAGE_BYTES } from '../../shared/images'
import { createTestDatabase } from './test-database'

// The first bytes of real files of each type, padded out.
const PNG_START = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const JPEG_START = [0xff, 0xd8, 0xff, 0xe0]
const WEBP_START = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]

let env: Env
let dispose: () => Promise<void>

beforeEach(async () => {
  const bindings = await createTestDatabase()
  dispose = bindings.dispose
  // Local development mode: the sign-in check is covered in admin.spec.ts.
  env = { DB: bindings.db, IMAGES: bindings.images, LOCAL_DEV_NO_LOGIN: 'true' }
})
afterEach(async () => {
  await dispose()
})

function fileOf(start: number[], type: string, size = 1024, name = 'picture') {
  const bytes = new Uint8Array(size)
  bytes.set(start)
  return new File([bytes], name, { type })
}

function upload(file: File | null, host = 'http://localhost:5173') {
  const form = new FormData()
  if (file) form.set('image', file)
  return app.request(`${host}/api/admin/images`, { method: 'POST', body: form }, env)
}

async function uploadedKey(file: File): Promise<string> {
  const response = await upload(file)
  expect(response.status).toBe(201)
  return ((await response.json()) as { key: string }).key
}

describe('POST /api/admin/images', () => {
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

  it('refuses an upload that is not signed in', async () => {
    env = { ...env, LOCAL_DEV_NO_LOGIN: undefined, ACCESS_TEAM_DOMAIN: 'team.example', ACCESS_AUD: 'aud' }
    expect((await upload(fileOf(PNG_START, 'image/png'), 'https://author.example')).status).toBe(401)
  })
})

describe('GET /api/images/<name>', () => {
  it('serves an uploaded picture with its type and a long cache', async () => {
    const key = await uploadedKey(fileOf(PNG_START, 'image/png', 2048))
    const response = await app.request(`/api/${key}`, {}, env)
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/png')
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable')
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect((await response.arrayBuffer()).byteLength).toBe(2048)
  })

  it('answers 404 for a picture that does not exist', async () => {
    const response = await app.request('/api/images/00000000-0000-4000-8000-000000000000.png', {}, env)
    expect(response.status).toBe(404)
  })

  it('serves only picture names, not other files in the bucket', async () => {
    await env.IMAGES.put('images/notes.html', '<script>alert(1)</script>')
    const response = await app.request('/api/images/notes.html', {}, env)
    expect(response.status).toBe(404)
  })
})
