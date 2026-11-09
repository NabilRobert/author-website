/**
 * The editor's API, behind requireOwner (server/access.ts):
 *
 *   GET /api/admin/content   the content to edit, never cached
 *   PUT /api/admin/content   save the whole site
 */
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { siteContentSchema } from '../shared/schema'
import type { Env } from './env'
import { requireOwner } from './access'
import { loadContent } from './content-read'
import { saveContent, StaleSaveError } from './content-write'

// The whole site as JSON is a few tens of kilobytes; this leaves room to
// spare and stops an oversized request before it is read.
const MAX_SAVE_BYTES = 1024 * 1024

export const adminRoutes = new Hono<{ Bindings: Env }>()

adminRoutes.use('*', requireOwner)

adminRoutes.get('/content', async (c) => {
  c.header('Cache-Control', 'no-store')
  const content = await loadContent(c.env.DB)
  if (!content) return c.json({ error: 'This site has no content yet.' }, 404)
  return c.json(content)
})

adminRoutes.put(
  '/content',
  bodyLimit({
    maxSize: MAX_SAVE_BYTES,
    onError: (c) => c.json({ error: 'That is too much to save at once. Remove some text and try again.' }, 413),
  }),
  async (c) => {
    const body: unknown = await c.req.json().catch(() => undefined)
    const parsed = siteContentSchema.safeParse(body)
    if (!parsed.success) {
      const issues = parsed.error.issues.map(({ path, message }) => ({ path, message }))
      return c.json({ error: 'Some fields need fixing before the site can be saved.', issues }, 400)
    }
    try {
      return c.json(await saveContent(c.env.DB, parsed.data, new Date()))
    } catch (error) {
      if (!(error instanceof StaleSaveError)) throw error
      const message =
        'The site was changed in another tab since you opened the editor. Reload the editor to get the latest version.'
      return c.json({ error: message }, 409)
    }
  },
)
