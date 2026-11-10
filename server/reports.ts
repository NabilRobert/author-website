/**
 * POST /api/sites/<name>/report: a visitor reports a page that breaks the
 * rules. The report is stored, and Arthur (REPORTS_EMAIL) gets an email so
 * he can look at the page and hide it if needed
 * (server/node/takedown-cli.ts).
 */
import { Hono } from 'hono'
import { z } from 'zod'
import { findSiteByName } from './sites'
import type { AppEnv } from './session'

// Enough to stop a flood of reports against one page.
const MAX_REPORTS_PER_SITE_PER_HOUR = 20
// Report notices share Resend's 100 emails a day with login codes; past
// this, reports are still stored and listed by the takedown command.
export const REPORT_NOTICES_PER_DAY = 10

const reportSchema = z.object({
  reason: z.string().trim().min(5, 'Say briefly what is wrong.').max(1000, 'Keep it under 1,000 characters.'),
})

export const reportRoutes = new Hono<AppEnv>()

reportRoutes.post('/sites/:name/report', async (c) => {
  const site = await findSiteByName(c.env.DB, c.req.param('name'))
  if (!site) return c.json({ error: 'There is no page at this address.' }, 404)
  const parsed = reportSchema.safeParse(await c.req.json().catch(() => undefined))
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message ?? 'Say briefly what is wrong.' }, 400)
  const recent = await countReports(c.env.DB, '-1 hour', site.id)
  if (recent >= MAX_REPORTS_PER_SITE_PER_HOUR) {
    return c.json({ error: 'This page has many reports already. Thank you; they are being looked at.' }, 429)
  }
  const reportsToday = await countReports(c.env.DB, '-1 day')
  await c.env.DB.prepare('INSERT INTO reports (id, site_id, reason, created_at) VALUES (?, ?, ?, datetime(?))')
    .bind(crypto.randomUUID(), site.id, parsed.data.reason, new Date().toISOString())
    .run()
  const moderator = c.env.REPORTS_EMAIL
  if (moderator && reportsToday < REPORT_NOTICES_PER_DAY) {
    // The report is saved either way; a failed email must not lose it.
    await c.var
      .sendReportNotice({ to: moderator, siteName: site.name, reason: parsed.data.reason })
      .catch((error: unknown) => console.error('The report notice email failed:', error))
  }
  return c.json({ ok: true }, 201)
})

// Reports since `since` (an SQLite modifier like '-1 hour'), for one site or all.
async function countReports(db: D1Database, since: string, siteId?: string): Promise<number> {
  const forSite = siteId ? ' AND site_id = ?' : ''
  const statement = db.prepare(`SELECT COUNT(*) AS count FROM reports WHERE created_at > datetime('now', ?)${forSite}`)
  const row = await (siteId ? statement.bind(since, siteId) : statement.bind(since)).first<{ count: number }>()
  return row?.count ?? 0
}
