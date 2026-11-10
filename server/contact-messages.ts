/**
 * POST /api/sites/<name>/messages: a visitor's message from a contact form,
 * emailed to the site's owner.
 *
 * - It goes to the owner's login email (confirmed at sign-up), never to the
 *   public contact email: otherwise anyone could make a site that sends
 *   messages to an address of their choosing.
 * - The message is emailed, not stored. To limit spam, only a salted hash
 *   of the sender (their IP address) and the time are kept, for a day.
 * - A filled-in trap field (`website`) means a bot: it is told "sent" and
 *   nothing is sent.
 * - Limits keep one sender from flooding a site, and a cap across all sites
 *   keeps contact messages well inside Resend's free 100 emails a day, so
 *   sign-up and password-reset codes, which share that quota, still go out.
 */
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { contactMessageSchema } from '../shared/contact'
import { findSiteByName } from './sites'
import type { AppEnv } from './session'

export const MESSAGES_PER_SENDER_PER_HOUR = 3
export const MESSAGES_PER_SITE_PER_DAY = 20
// Resend's free tier sends 100 a day; this leaves at least half for codes
// and report notices (server/reports.ts).
export const MESSAGES_PER_DAY_ALL_SITES = 40
const MAX_BODY_BYTES = 16 * 1024
const NO_SITE = 'There is no page at this address.'

export const contactRoutes = new Hono<AppEnv>()

contactRoutes.post('/sites/:name/messages', bodyLimit({ maxSize: MAX_BODY_BYTES }), async (c) => {
  const site = await findSiteByName(c.env.DB, c.req.param('name'))
  if (!site || site.isHidden) return c.json({ error: NO_SITE }, 404)
  const parsed = contactMessageSchema.safeParse(await c.req.json().catch(() => undefined))
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' }, 400)
  if (parsed.data.website) return c.json({ ok: true }, 201)

  const sender = await senderHash(c.req.header('cf-connecting-ip') ?? 'unknown', c.env.BETTER_AUTH_SECRET)
  const refusal = await checkLimits(c.env.DB, site.id, sender)
  if (refusal) return c.json({ error: refusal }, 429)
  const owner = await c.env.DB.prepare('SELECT email FROM "user" WHERE id = ?')
    .bind(site.ownerUserId)
    .first<{ email: string }>()
  if (!owner) return c.json({ error: NO_SITE }, 404)

  const { name, email, message } = parsed.data
  await c.var.sendContactMessage({
    to: owner.email,
    siteName: site.name,
    senderName: name,
    senderEmail: email,
    message,
  })
  await c.env.DB.prepare('INSERT INTO contact_messages (site_id, sender_hash, sent_at) VALUES (?, ?, ?)')
    .bind(site.id, sender, new Date().toISOString())
    .run()
  return c.json({ ok: true }, 201)
})

// Why another message can't go yet, or null. Also forgets day-old rows.
async function checkLimits(db: D1Database, siteId: string, sender: string): Promise<string | null> {
  const now = Date.now()
  const hourAgo = new Date(now - 60 * 60 * 1000).toISOString()
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString()
  const count = 'SELECT COUNT(*) AS count FROM contact_messages WHERE sent_at > ?'
  const [, bySender, bySite, allSites] = await db.batch<{ count: number }>([
    db.prepare('DELETE FROM contact_messages WHERE sent_at < ?').bind(dayAgo),
    db.prepare(`${count} AND sender_hash = ?`).bind(hourAgo, sender),
    db.prepare(`${count} AND site_id = ?`).bind(dayAgo, siteId),
    db.prepare(count).bind(dayAgo),
  ])
  const limits: [D1Result<{ count: number }> | undefined, number, string][] = [
    [bySender, MESSAGES_PER_SENDER_PER_HOUR, 'You have sent several messages in a row. Please wait an hour'],
    [bySite, MESSAGES_PER_SITE_PER_DAY, 'This page has had many messages today. Please try again tomorrow'],
    [allSites, MESSAGES_PER_DAY_ALL_SITES, 'Framed has sent its contact messages for today. Please try again tomorrow'],
  ]
  for (const [result, limit, refusal] of limits) {
    if ((result?.results[0]?.count ?? 0) >= limit) return `${refusal}, or email them directly.`
  }
  return null
}

// Salted with the site's secret, so the stored value can't be turned back
// into an IP address by trying them all.
async function senderHash(ip: string, secret: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${secret}:${ip}`))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}
