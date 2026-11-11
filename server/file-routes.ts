/**
 * Files to download, stored (R2, or disk on the VPS) under `files/<random id>.pdf`:
 *
 *   POST /api/me/files        upload a PDF to my site, within its allowance
 *   GET  /api/files/<name>    download one (?as=<label> names the file)
 *
 * They are always sent as downloads (Content-Disposition: attachment) and
 * sandboxed, never shown inside Framed's own pages: a PDF can carry script.
 */
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { FILE_TOO_BIG_MESSAGE, FILE_TYPE, FILE_WRONG_TYPE_MESSAGE, MAX_FILE_BYTES } from '../shared/files'
import { requireSite } from './session'
import { requireStorage } from './storage'
import type { AppEnv } from './session'
import { checkImageAllowance, recordImage } from './image-limits'

const FILE_NAME = /^[a-z0-9-]+\.pdf$/
// Room for the multipart wrapping around a file at the size limit.
const MAX_UPLOAD_BYTES = MAX_FILE_BYTES + 64 * 1024
const ONE_YEAR_CACHE = 'public, max-age=31536000, immutable'
// Every PDF starts with "%PDF-".
const PDF_START = [0x25, 0x50, 0x44, 0x46, 0x2d]

/** Uploading, mounted under /api/me behind the login check. */
export const fileUploadRoutes = new Hono<AppEnv>()

fileUploadRoutes.post(
  '/files',
  requireSite,
  requireStorage,
  bodyLimit({ maxSize: MAX_UPLOAD_BYTES, onError: (c) => c.json({ error: FILE_TOO_BIG_MESSAGE }, 413) }),
  async (c) => {
    const form = await c.req.formData().catch(() => null)
    const file = form?.get('file')
    if (!(file instanceof File)) return c.json({ error: 'Choose a file to upload.' }, 400)
    if (file.size > MAX_FILE_BYTES) return c.json({ error: FILE_TOO_BIG_MESSAGE }, 413)
    const bytes = new Uint8Array(await file.arrayBuffer())
    const isPdf = file.type === FILE_TYPE && PDF_START.every((value, index) => bytes[index] === value)
    if (!isPdf) return c.json({ error: FILE_WRONG_TYPE_MESSAGE }, 415)
    const refusal = await checkImageAllowance(c.env.DB, c.var.site.id, bytes.length)
    if (refusal) return c.json({ error: refusal }, 403)

    const key = `files/${crypto.randomUUID()}.pdf`
    await c.var.storage.put(key, bytes, { httpMetadata: { contentType: FILE_TYPE } })
    await recordImage(c.env.DB, c.var.site.id, key, bytes.length, new Date())
    return c.json({ key }, 201)
  },
)

/** Downloading, public. */
export const fileServeRoutes = new Hono<AppEnv>()

fileServeRoutes.get('/files/:name', requireStorage, async (c) => {
  const name = c.req.param('name')
  if (!FILE_NAME.test(name)) return c.json({ error: 'There is no such file.' }, 404)
  const file = await c.var.storage.get(`files/${name}`)
  if (!file) return c.json({ error: 'There is no such file.' }, 404)
  return c.body(file.body, 200, {
    'Content-Type': FILE_TYPE,
    'Content-Disposition': `attachment; filename="${downloadName(c.req.query('as'))}"`,
    'Content-Security-Policy': 'sandbox',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': ONE_YEAR_CACHE,
  })
})

// The label the owner gave the file, made safe for a header: letters,
// numbers, spaces, dashes and underscores only.
function downloadName(label: string | undefined): string {
  const safe = (label ?? '')
    .replace(/[^A-Za-z0-9 _-]/g, '')
    .trim()
    .slice(0, 80)
  return `${safe || 'download'}.pdf`
}
