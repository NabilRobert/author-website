/**
 * Storage for uploaded pictures and PDFs (R2, the IMAGES binding) is
 * optional. Without it, Framed runs with uploads switched off: the routes
 * that store or serve files answer 503, and the editor hides its upload
 * buttons (GET /api/features). Adding the binding back to wrangler.toml
 * turns uploads on again.
 */
import { Hono } from 'hono'
import { createMiddleware } from 'hono/factory'
import type { AppEnv } from './session'

export const UPLOADS_OFF = 'Uploading pictures and files is switched off for now.'

/** Gives the route the storage bucket (c.var.storage), or refuses when there is none. */
export const requireStorage = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.env.IMAGES) return c.json({ error: UPLOADS_OFF }, 503)
  c.set('storage', c.env.IMAGES)
  await next()
})

/** What this deployment can do, for the editor. */
export const featureRoutes = new Hono<AppEnv>()

featureRoutes.get('/features', (c) => c.json({ uploads: Boolean(c.env.IMAGES) }))
