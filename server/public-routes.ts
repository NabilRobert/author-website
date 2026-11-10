/**
 * What anyone can ask for:
 *
 *   GET  /api/sites/<name>/content   someone's whole site, for their public pages
 *   POST /api/sites/<name>/report    report a page that breaks the rules (server/reports.ts)
 *   POST /api/sites/<name>/messages  a contact-form message (server/contact-messages.ts)
 *   POST /api/sites/<name>/visits    count a page view (server/visits.ts)
 */
import { Hono } from 'hono'
import { loadContent } from './content-read'
import { findSiteByName } from './sites'
import type { AppEnv } from './session'

// Visitors may see a saved change up to a minute late; in return, most
// page views are served from cache instead of reading the database.
const PUBLIC_CACHE = 'public, max-age=60'
export const publicRoutes = new Hono<AppEnv>()

publicRoutes.get('/sites/:name/content', async (c) => {
  const site = await findSiteByName(c.env.DB, c.req.param('name'))
  if (!site || site.isHidden) return c.json({ error: 'There is no page at this address.', reason: 'no-site' }, 404)
  const content = await loadContent(c.env.DB, site.id)
  if (!content) return c.json({ error: 'This page is being set up.', reason: 'not-set-up' }, 404)
  c.header('Cache-Control', PUBLIC_CACHE)
  // Saved layouts are the owner's tools, not part of the page visitors see.
  return c.json({ ...content, savedLayouts: [] })
})
