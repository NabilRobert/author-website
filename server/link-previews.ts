/**
 * Link previews: what LinkedIn, WhatsApp, X and others show when someone
 * shares a page. They read the page's <meta> tags and don't run its
 * JavaScript, so the server writes them into the HTML it sends
 * (functions/_middleware.ts). The titles match what the browser sets
 * afterwards (src/composables/usePageHead.ts).
 */
import type { Block } from '../shared/blocks'
import type { SiteContent } from '../shared/schema'
import { imageUrl } from '../shared/images'
import { paragraphs } from '../shared/text'

export interface LinkPreview {
  title: string
  description: string
  // A stored picture's key, or null for none.
  imageKey: string | null
}

// Previews cut descriptions off at about this length anyway.
const DESCRIPTION_LENGTH = 200

/**
 * The preview for `path` within a site ('' is its front page, 'about' a
 * page, 'work/lantern' a work's page), or null where the site has no page.
 */
export function linkPreviewFor(content: SiteContent, path: string): LinkPreview | null {
  const [first = '', second, ...rest] = path.split('/').filter(Boolean)
  if (rest.length) return null
  if (first === 'work' && second) return workPreview(content, second)
  if (second) return null
  const page = content.pages.find((candidate) => candidate.slug === first)
  if (!page) return null
  const { name, bioShort, photoKey } = content.profile
  return {
    title: page.slug ? `${page.title} · ${name}` : name,
    description: shorten(bioShort),
    imageKey: firstPicture(page.blocks) ?? photoKey,
  }
}

function workPreview(content: SiteContent, slug: string): LinkPreview | null {
  const work = content.works.find((candidate) => candidate.showPage && candidate.pageSlug === slug)
  if (!work) return null
  const firstParagraph = paragraphs(work.description)[0] ?? ''
  return {
    title: `${work.title} · ${content.profile.name}`,
    description: shorten([work.subtitle, firstParagraph].filter(Boolean).join(': ') || content.profile.bioShort),
    imageKey:
      work.imageKey ?? work.morePictures[0]?.imageKey ?? firstPicture(work.pageBlocks) ?? content.profile.photoKey,
  }
}

// The first picture a page shows: a banner's, a picture block's or a gallery's.
function firstPicture(blocks: Block[]): string | null {
  for (const block of blocks) {
    if (block.type === 'gallery' && block.pictures[0]?.imageKey) return block.pictures[0].imageKey
    if ((block.type === 'hero' || block.type === 'imageText') && block.imageKey) return block.imageKey
  }
  return null
}

function shorten(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length <= DESCRIPTION_LENGTH ? flat : `${flat.slice(0, DESCRIPTION_LENGTH - 1).trimEnd()}…`
}

/** The <meta> tags for `preview`, with every value escaped for HTML. */
export function previewTags(preview: LinkPreview, pageUrl: string, siteUrl: string): string {
  const tags: [string, string, string][] = [
    ['name', 'description', preview.description],
    ['property', 'og:title', preview.title],
    ['property', 'og:description', preview.description],
    ['property', 'og:type', 'website'],
    ['property', 'og:url', pageUrl],
    ['name', 'twitter:card', preview.imageKey ? 'summary_large_image' : 'summary'],
  ]
  if (preview.imageKey) tags.push(['property', 'og:image', `${siteUrl}${imageUrl(preview.imageKey)}`])
  return tags.map(([attribute, key, value]) => `<meta ${attribute}="${key}" content="${escapeHtml(value)}" />`).join('')
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
