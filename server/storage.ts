/**
 * Storage for uploaded pictures and PDFs (the IMAGES binding) is optional.
 * The Node version always sets it (a folder on disk, server/node/disk-bucket.ts);
 * on Cloudflare it is an R2 bucket in wrangler.toml. Without it, Framed runs
 * with uploads switched off: the routes that store or serve files answer
 * 503, and the editor hides its upload buttons (GET /api/features).
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
