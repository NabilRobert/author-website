/**
 * Adds link-preview tags (server/link-previews.ts) to the HTML of a site's
 * pages as Cloudflare Pages sends them (functions/_middleware.ts). The page
 * itself is the same single-page app for every address; only its <head>
 * changes. If anything goes wrong, the page goes out unchanged: a preview
 * is a nicety, never a reason to fail.
 */
import { siteNameSchema } from '../shared/names'
import { loadContent } from './content-read'
import type { Env } from './env'
import { linkPreviewFor, previewTags } from './link-previews'
import type { LinkPreview } from './link-previews'
import { findSiteByName } from './sites'

export async function withLinkPreview(request: Request, env: Env, next: () => Promise<Response>): Promise<Response> {
  const url = new URL(request.url)
  const [siteName, ...rest] = url.pathname.split('/').filter(Boolean)
  // Framed's own pages (/login, /api/…, /assets/…) aren't sites.
  if (!siteName || !siteNameSchema.safeParse(siteName).success) return next()
  const response = await next()
  if (!response.headers.get('content-type')?.includes('text/html')) return response
  try {
    const preview = await findPreview(env, siteName, rest.join('/'))
    return preview ? addTags(response, preview, url, env.SITE_URL) : response
  } catch (error) {
    console.error('Link preview skipped:', error)
    return response
  }
}

async function findPreview(env: Env, siteName: string, path: string): Promise<LinkPreview | null> {
  const site = await findSiteByName(env.DB, siteName)
  if (!site || site.isHidden) return null
  const content = await loadContent(env.DB, site.id)
  return content ? linkPreviewFor(content, path) : null
}

function addTags(response: Response, preview: LinkPreview, url: URL, siteUrl: string): Response {
  const tags = previewTags(preview, `${siteUrl}${url.pathname}`, siteUrl)
  return new HTMLRewriter()
    .on('title', { element: (title) => void title.setInnerContent(preview.title) })
    .on('head', { element: (head) => void head.append(tags, { html: true }) })
    .transform(response)
}
