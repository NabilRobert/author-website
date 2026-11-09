/**
 * The API, as a Hono app. It runs as a Cloudflare Pages Function
 * (functions/api/[[path]].ts), so every request to /api/* lands here.
 *
 * Public:  GET /api/content   the whole site, for the public pages
 */
import { Hono } from 'hono'
import type { Env } from './env'
import { loadContent } from './content-read'

// Visitors may see a saved change up to a minute late; in return, most
// page views are served from cache instead of reading the database.
const PUBLIC_CACHE = 'public, max-age=60'

export const app = new Hono<{ Bindings: Env }>().basePath('/api')

app.get('/content', async (c) => {
  const content = await loadContent(c.env.DB)
  if (!content) {
    return c.json({ error: 'This site has no content yet. Open /edit to set it up.' }, 404)
  }
  c.header('Cache-Control', PUBLIC_CACHE)
  return c.json(content)
})

app.notFound((c) => c.json({ error: `There is no API address ${c.req.method} ${c.req.path}.` }, 404))

// Details go to the Cloudflare logs; the browser gets a message a person
// can act on, without internals.
app.onError((error, c) => {
  console.error(error)
  return c.json({ error: 'Something went wrong on the server. Try again in a minute.' }, 500)
})
