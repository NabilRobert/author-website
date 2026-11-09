/**
 * Visit counts, for owners to see in their editor:
 *
 *   POST /api/sites/<name>/visits   count one view of a page (sent by the page)
 *   GET  /api/me/visits             my last 30 days, and my most-visited pages
 *
 * Only a number per page per day is kept: no cookies, no IP addresses,
 * nothing about who visited. The site's own owner and its editor preview
 * don't count (src/content/countVisit.ts). Anyone could send extra counts,
 * so they are a rough guide, not proof. Each view is one D1 write; the
 * free plan allows 100,000 a day across all of Framed.
 */
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { z } from 'zod'
import { findSiteByName } from './sites'
import { requireSite } from './session'
import type { AppEnv } from './session'

export const KEEP_DAYS = 90
const SHOWN_DAYS = 30
const TOP_PAGES = 10
const DAY_MS = 24 * 60 * 60 * 1000
// '/' for the front page, '/about', or '/work/lantern'.
const visitSchema = z.object({
  path: z
    .string()
    .regex(/^\/([a-z0-9-]+(\/[a-z0-9-]+)?)?$/)
    .max(120),
})

/** "2026-11-09" for `daysAgo` days before `now` (UTC). */
export function dayKey(now: number, daysAgo = 0): string {
  return new Date(now - daysAgo * DAY_MS).toISOString().slice(0, 10)
}

/** Counting, public. The body is plain text JSON, as a page's beacon sends it. */
export const visitCountRoutes = new Hono<AppEnv>()

visitCountRoutes.post('/sites/:name/visits', bodyLimit({ maxSize: 1024 }), async (c) => {
  const parsed = visitSchema.safeParse(await c.req.json().catch(() => undefined))
  if (!parsed.success) return c.body(null, 400)
  const site = await findSiteByName(c.env.DB, c.req.param('name'))
  if (!site || site.isHidden) return c.body(null, 404)
  const now = Date.now()
  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO visits (site_id, day, path, count) VALUES (?, ?, ?, 1)
       ON CONFLICT (site_id, day, path) DO UPDATE SET count = count + 1`,
    ).bind(site.id, dayKey(now), parsed.data.path),
    c.env.DB.prepare('DELETE FROM visits WHERE site_id = ? AND day < ?').bind(site.id, dayKey(now, KEEP_DAYS)),
  ])
  return c.body(null, 204)
})

/** The owner's numbers, mounted under /api/me behind the login check. */
export const visitStatsRoutes = new Hono<AppEnv>()

visitStatsRoutes.get('/visits', requireSite, async (c) => {
  const now = Date.now()
  const since = dayKey(now, SHOWN_DAYS - 1)
  const [byDay, byPage] = await c.env.DB.batch<{ day: string; path: string; count: number }>([
    c.env.DB.prepare('SELECT day, SUM(count) AS count FROM visits WHERE site_id = ? AND day >= ? GROUP BY day').bind(
      c.var.site.id,
      since,
    ),
    c.env.DB.prepare(
      'SELECT path, SUM(count) AS count FROM visits WHERE site_id = ? AND day >= ? GROUP BY path ORDER BY count DESC, path LIMIT ?',
    ).bind(c.var.site.id, since, TOP_PAGES),
  ])
  const counts = new Map((byDay?.results ?? []).map((row) => [row.day, row.count]))
  // Every one of the last 30 days, oldest first, with 0 for a day nobody came.
  const days = Array.from({ length: SHOWN_DAYS }, (_, index) => {
    const day = dayKey(now, SHOWN_DAYS - 1 - index)
    return { day, count: counts.get(day) ?? 0 }
  })
  const pages = (byPage?.results ?? []).map(({ path, count }) => ({ path, count }))
  return c.json({ days, pages })
})
