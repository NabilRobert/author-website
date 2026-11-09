// Cloudflare Pages sends every request under /api/ to this function; the
// Hono app in server/app.ts does the routing.
import { handle } from 'hono/cloudflare-pages'
import { app } from '../../server/app'

export const onRequest = handle(app)
