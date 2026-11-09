/**
 * The logged-in person's site content (mounted under /api/me):
 *
 *   GET /api/me/content   to edit, never cached
 *   PUT /api/me/content   save the whole site
 */
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { siteContentSchema } from '../shared/schema'
import { loadContent } from './content-read'
import { saveContent, StaleSaveError } from './content-write'
import { pruneUnusedImages } from './image-routes'
import { requireSite } from './session'
import type { AppEnv } from './session'

// The whole site as JSON is a few tens of kilobytes; this leaves room to
// spare and stops an oversized request before it is read.
const MAX_SAVE_BYTES = 1024 * 1024
const STALE_MESSAGE =
  'The site was changed in another tab since you opened the editor. Reload the editor to get the latest version.'

export const contentRoutes = new Hono<AppEnv>()

contentRoutes.use('/content', requireSite)

contentRoutes.get('/content', async (c) => {
  c.header('Cache-Control', 'no-store')
  const content = await loadContent(c.env.DB, c.var.site.id)
  if (!content) return c.json({ error: 'Your site has no content yet.' }, 404)
  return c.json(content)
})

contentRoutes.put(
  '/content',
  bodyLimit({
    maxSize: MAX_SAVE_BYTES,
    onError: (c) => c.json({ error: 'That is too much to save at once. Remove some text and try again.' }, 413),
  }),
  async (c) => {
    const parsed = siteContentSchema.safeParse(await c.req.json().catch(() => undefined))
    if (!parsed.success) {
      const issues = parsed.error.issues.map(({ path, message }) => ({ path, message }))
      return c.json({ error: 'Some fields need fixing before the site can be saved.', issues }, 400)
    }
    try {
      const saved = await saveContent(c.env.DB, c.var.site.id, parsed.data, new Date())
      await pruneUnusedImages(c.env, c.var.site.id, saved, new Date())
      return c.json(saved)
    } catch (error) {
      if (!(error instanceof StaleSaveError)) throw error
      return c.json({ error: STALE_MESSAGE }, 409)
    }
  },
)
