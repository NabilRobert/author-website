/**
 * Pictures, stored in R2 under `images/<random id>.<jpg|png|webp>`:
 *
 *   POST /api/me/images        upload one to my site, within its limits
 *   GET  /api/images/<name>    serve one to anyone
 *
 * The bucket is never public; pictures are served through here. Because a
 * key is never reused, a picture can be cached for a year.
 */
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { IMAGE_TYPES, isImageType, MAX_IMAGE_BYTES, TOO_BIG_MESSAGE, WRONG_TYPE_MESSAGE } from '../shared/images'
import type { ImageType } from '../shared/images'
import { requireSite } from './session'
import { requireStorage } from './storage'
import type { AppEnv } from './session'
import { checkImageAllowance, recordImage } from './image-limits'
export { pruneUnusedImages } from './image-limits'

const IMAGE_NAME = /^[a-z0-9-]+\.(jpg|png|webp)$/
// Room for the multipart wrapping around a picture at the size limit.
const MAX_UPLOAD_BYTES = MAX_IMAGE_BYTES + 64 * 1024
const ONE_YEAR_CACHE = 'public, max-age=31536000, immutable'

/** Uploading, mounted under /api/me behind the login check. */
export const imageUploadRoutes = new Hono<AppEnv>()

imageUploadRoutes.post(
  '/images',
  requireSite,
  requireStorage,
  bodyLimit({ maxSize: MAX_UPLOAD_BYTES, onError: (c) => c.json({ error: TOO_BIG_MESSAGE }, 413) }),
  async (c) => {
    const form = await c.req.formData().catch(() => null)
    const file = form?.get('image')
    if (!(file instanceof File)) return c.json({ error: 'Choose a picture to upload.' }, 400)
    if (file.size > MAX_IMAGE_BYTES) return c.json({ error: TOO_BIG_MESSAGE }, 413)
    const bytes = new Uint8Array(await file.arrayBuffer())
    if (!isImageType(file.type) || !startsLike(file.type, bytes)) return c.json({ error: WRONG_TYPE_MESSAGE }, 415)
    const refusal = await checkImageAllowance(c.env.DB, c.var.site.id, bytes.length)
    if (refusal) return c.json({ error: refusal }, 403)

    const key = `images/${crypto.randomUUID()}.${IMAGE_TYPES[file.type]}`
    await c.var.storage.put(key, bytes, { httpMetadata: { contentType: file.type } })
    await recordImage(c.env.DB, c.var.site.id, key, bytes.length, new Date())
    return c.json({ key }, 201)
  },
)

/** Serving, public. */
export const imageServeRoutes = new Hono<AppEnv>()

imageServeRoutes.get('/images/:name', requireStorage, async (c) => {
  const name = c.req.param('name')
  if (!IMAGE_NAME.test(name)) return c.json({ error: 'There is no such picture.' }, 404)
  const image = await c.var.storage.get(`images/${name}`)
  if (!image) return c.json({ error: 'There is no such picture.' }, 404)
  return c.body(image.body, 200, {
    'Content-Type': image.httpMetadata?.contentType ?? 'application/octet-stream',
    'Cache-Control': ONE_YEAR_CACHE,
    // The browser must not guess another type from the bytes.
    'X-Content-Type-Options': 'nosniff',
  })
})

// The first bytes every file of that type starts with, so a file named
// .jpg that is really something else is refused.
function startsLike(type: ImageType, bytes: Uint8Array): boolean {
  const startsWith = (offset: number, expected: number[]) =>
    expected.every((value, index) => bytes[offset + index] === value)
  if (type === 'image/jpeg') return startsWith(0, [0xff, 0xd8, 0xff])
  if (type === 'image/png') return startsWith(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  // RIFF....WEBP
  return startsWith(0, [0x52, 0x49, 0x46, 0x46]) && startsWith(8, [0x57, 0x45, 0x42, 0x50])
}
