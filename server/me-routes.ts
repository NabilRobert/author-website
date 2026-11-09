/**
 * The logged-in person's own things (requireUser, server/session.ts):
 *
 *   GET    /api/me            who am I, and my site's name if I have one
 *   POST   /api/me/site       claim a name: framed.my.id/<name>
 *   GET    /api/me/content    my site's content, never cached
 *   PUT    /api/me/content    save my whole site
 *   POST   /api/me/images     upload a picture (server/image-routes.ts)
 *   DELETE /api/me            delete my account, site and pictures
 */
import { Hono } from 'hono'
import { csrf } from 'hono/csrf'
import { siteNameSchema } from '../shared/names'
import { createSite, findSiteByOwner } from './sites'
import { requireUser } from './session'
import type { AppEnv } from './session'
import { contentRoutes } from './content-routes'
import { imageUploadRoutes } from './image-routes'
import { deleteAccount } from './account-deletion'

export const meRoutes = new Hono<AppEnv>()

// Writes must come from Framed's own pages (Origin header), on top of the
// login cookie's SameSite rule.
meRoutes.use('*', csrf(), requireUser)

meRoutes.get('/', async (c) => {
  const site = await findSiteByOwner(c.env.DB, c.var.user.id)
  return c.json({ email: c.var.user.email, site: site ? { name: site.name } : null })
})

meRoutes.post('/site', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { name?: unknown }
  const parsed = siteNameSchema.safeParse(body.name)
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message ?? 'Pick a name.' }, 400)
  const existing = await findSiteByOwner(c.env.DB, c.var.user.id)
  if (existing) return c.json({ error: `You already have a page: /${existing.name}` }, 409)
  const site = await createSite(c.env.DB, c.var.user.id, parsed.data, new Date())
  if (!site) return c.json({ error: 'That name is taken. Try another.' }, 409)
  return c.json({ name: site.name }, 201)
})

meRoutes.delete('/', async (c) => {
  await deleteAccount(c.env, c.var.user.id)
  return c.json({ ok: true })
})

meRoutes.route('/', contentRoutes)
meRoutes.route('/', imageUploadRoutes)
