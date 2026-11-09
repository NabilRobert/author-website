/**
 * The API's per-request context, and the two checks every "me" route
 * starts with: someone is logged in (requireUser), and they have a site
 * (requireSite). The site always comes from the login, never from the
 * request, so nobody can write to someone else's site.
 */
import { createMiddleware } from 'hono/factory'
import type { Env } from './env'
import type { Auth } from './auth'
import type { SendContactMessage } from './email'
import { findSiteByOwner } from './sites'
import type { Site } from './sites'

export interface AppEnv {
  Bindings: Env
  Variables: {
    /** Better Auth for this request, created on first use (server/app.ts). */
    auth: () => Auth
    /** Emails a contact-form message (server/email.ts); tests pass one that keeps them. */
    sendContactMessage: SendContactMessage
    user: { id: string; email: string }
    site: Site
  }
}

export const requireUser = createMiddleware<AppEnv>(async (c, next) => {
  const session = await c.var.auth().api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.json({ error: 'You are not logged in, or your login has expired. Log in again.' }, 401)
  c.set('user', { id: session.user.id, email: session.user.email })
  await next()
})

export const requireSite = createMiddleware<AppEnv>(async (c, next) => {
  const site = await findSiteByOwner(c.env.DB, c.var.user.id)
  if (!site) return c.json({ error: "You haven't picked a name for your page yet." }, 404)
  c.set('site', site)
  await next()
})
