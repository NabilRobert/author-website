/**
 * The Node version of Framed as one Hono app: the API (server/app.ts) at
 * /api/*, the built site's files, and every other address answered with
 * the single-page app's index.html, with link previews added
 * (server/link-preview-page.ts). The visitor's address is checked before
 * the API sees it (server/node/client-ip.ts), and uploads are handled one at a
 * time (server/node/upload-queue.ts). Security headers come from the same
 * `_headers` file Cloudflare Pages uses, so both versions send the same ones.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { createApp } from '../app'
import type { Env } from '../env'
import { withLinkPreview } from '../link-preview-page'
import { withClientIp } from './client-ip'
import { createUploadQueue, isUploadRequest } from './upload-queue'

// Built files have a content hash in their name, so they never change.
const BUILT_FILE_CACHE = 'public, max-age=31536000, immutable'

/** The headers for every address ("/*") in a Cloudflare `_headers` file. */
export function parseHeadersFile(text: string): [string, string][] {
  const headers: [string, string][] = []
  let isEveryAddress = false
  for (const line of text.split('\n')) {
    if (line.trim() === '' || line.trim().startsWith('#')) continue
    if (!line.startsWith(' ')) {
      isEveryAddress = line.trim() === '/*'
      continue
    }
    const separator = line.indexOf(':')
    if (isEveryAddress && separator > 0)
      headers.push([line.slice(0, separator).trim(), line.slice(separator + 1).trim()])
  }
  return headers
}

export function createNodeServer(distDir: string) {
  const securityHeaders = parseHeadersFile(readFileSync(join(distDir, '_headers'), 'utf8'))
  const indexHtml = readFileSync(join(distDir, 'index.html'), 'utf8')
  const api = createApp()
  const inTurn = createUploadQueue()
  const server = new Hono<{ Bindings: Env }>()

  server.use('*', async (c, next) => {
    await next()
    for (const [name, value] of securityHeaders) c.res.headers.set(name, value)
  })
  server.all('/api/*', (c) => {
    const answer = async () => api.fetch(withClientIp(c.req.raw), c.env)
    return isUploadRequest(c.req.method, c.req.path) ? inTurn(answer) : answer()
  })
  // Build files for Cloudflare Pages (_headers, _routes.json) aren't pages.
  server.all('/_*', (c) => c.text('Not found', 404))
  server.use('/assets/*', async (c, next) => {
    await next()
    if (c.res.ok) c.res.headers.set('Cache-Control', BUILT_FILE_CACHE)
  })
  server.use('*', serveStatic({ root: distDir }))
  server.get('*', (c) =>
    withLinkPreview(c.req.raw, c.env, async () => {
      return new Response(indexHtml, {
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' },
      })
    }),
  )
  return server
}
