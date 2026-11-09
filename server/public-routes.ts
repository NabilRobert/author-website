/**
 * What anyone can ask for:
 *
 *   GET  /api/sites/<name>/content   someone's whole site, for their public pages
 *   POST /api/sites/<name>/report    report a page that breaks the rules
 *   POST /api/sites/<name>/messages  a contact-form message (server/contact-messages.ts)
 */
import { Hono } from 'hono'
import { z } from 'zod'
import { loadContent } from './content-read'
import { findSiteByName } from './sites'
import type { AppEnv } from './session'

// Visitors may see a saved change up to a minute late; in return, most
// page views are served from cache instead of reading the database.
const PUBLIC_CACHE = 'public, max-age=60'
// Enough to stop a flood of reports against one page.
const MAX_REPORTS_PER_SITE_PER_HOUR = 20

const reportSchema = z.object({
  reason: z.string().trim().min(5, 'Say briefly what is wrong.').max(1000, 'Keep it under 1,000 characters.'),
})

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

publicRoutes.post('/sites/:name/report', async (c) => {
  const site = await findSiteByName(c.env.DB, c.req.param('name'))
  if (!site) return c.json({ error: 'There is no page at this address.' }, 404)
  const parsed = reportSchema.safeParse(await c.req.json().catch(() => undefined))
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message ?? 'Say briefly what is wrong.' }, 400)
  const recent = await c.env.DB.prepare(
    "SELECT COUNT(*) AS count FROM reports WHERE site_id = ? AND created_at > datetime('now', '-1 hour')",
  )
    .bind(site.id)
    .first<{ count: number }>()
  if ((recent?.count ?? 0) >= MAX_REPORTS_PER_SITE_PER_HOUR) {
    return c.json({ error: 'This page has many reports already. Thank you; they are being looked at.' }, 429)
  }
  await c.env.DB.prepare('INSERT INTO reports (id, site_id, reason, created_at) VALUES (?, ?, ?, datetime(?))')
    .bind(crypto.randomUUID(), site.id, parsed.data.reason, new Date().toISOString())
    .run()
  return c.json({ ok: true }, 201)
})
