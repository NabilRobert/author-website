// Runs before every request Cloudflare Pages routes to functions (see
// public/_routes.json: everything but the built files). Adds link previews
// to a site's pages; everything else passes straight through.
import type { Env } from '../server/env'
import { withLinkPreview } from '../server/link-preview-page'

export const onRequest: PagesFunction<Env> = (context) =>
  withLinkPreview(context.request, context.env, () => context.next())
