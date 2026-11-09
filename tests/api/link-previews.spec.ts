// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { linkPreviewFor, previewTags } from '../../server/link-previews'
import { withLinkPreview } from '../../server/link-preview-page'
import type { Env } from '../../server/env'
import { demoContent } from '../../shared/demo-content'

const COVER = 'images/0b8e2f4c-3a1d-4c6b-8e7f-2d9a5c1b3e01.jpg'
const [lantern, ...otherWorks] = demoContent.works
const content = { ...demoContent, works: [{ ...lantern!, imageKey: COVER }, ...otherWorks] }

describe('link previews', () => {
  it('uses the name and short bio for the front page', () => {
    expect(linkPreviewFor(content, '')).toEqual({
      title: 'Alex Rowan',
      description: demoContent.profile.bioShort,
      imageKey: null,
    })
  })

  it("titles a page like the browser tab does, 'About · Alex Rowan'", () => {
    expect(linkPreviewFor(content, 'about')?.title).toBe('About · Alex Rowan')
  })

  it("uses a work's title, line under it and cover for its page", () => {
    expect(linkPreviewFor(content, 'work/lantern')).toMatchObject({
      title: 'Lantern · Alex Rowan',
      description: expect.stringMatching(/^Mobile app: A small app/),
      imageKey: COVER,
    })
  })

  it("falls back to the first picture on a work's page when it has no cover", () => {
    const gallery = { ...demoContent.pages[0]!.blocks[0]!, type: 'gallery' as const }
    const pictures = [{ imageKey: COVER, imageCrop: { x: 50, y: 50, zoom: 1 }, description: '' }]
    const block = { id: gallery.id, style: gallery.style, type: 'gallery' as const, heading: '', pictures }
    const withGallery = {
      ...block,
      columns: 3 as const,
      imageShape: 'square' as const,
      pictureCorners: 'soft' as const,
    }
    const harbour = { ...demoContent.works[1]!, pageBlocks: [withGallery] }
    const site = { ...demoContent, works: [harbour] }
    expect(linkPreviewFor(site, 'work/harbour-library')?.imageKey).toBe(COVER)
  })

  it('has none for an address the site has no page at, or a work whose page is off', () => {
    const hidden = { ...content, works: [{ ...content.works[0]!, showPage: false }] }
    expect(linkPreviewFor(content, 'no-such-page')).toBeNull()
    expect(linkPreviewFor(content, 'work/lantern/extra')).toBeNull()
    expect(linkPreviewFor(hidden, 'work/lantern')).toBeNull()
  })

  it('cuts long descriptions to about 200 characters', () => {
    const long = { ...content, profile: { ...content.profile, bioShort: 'word '.repeat(100) } }
    expect(linkPreviewFor(long, '')!.description.length).toBeLessThanOrEqual(200)
  })

  it('writes the tags with the picture as a full address, and escapes what the owner typed', () => {
    const preview = { title: 'Say "hi" <b>', description: 'Fish & chips', imageKey: COVER }
    const tags = previewTags(preview, 'https://framed.my.id/alex', 'https://framed.my.id')
    expect(tags).toContain('<meta property="og:title" content="Say &quot;hi&quot; &lt;b&gt;" />')
    expect(tags).toContain('content="Fish &amp; chips"')
    expect(tags).toContain(`<meta property="og:image" content="https://framed.my.id/api/${COVER}" />`)
    expect(tags).toContain('<meta name="twitter:card" content="summary_large_image" />')
  })
})

describe('adding previews to pages', () => {
  // A database that fails if touched, to prove pages that aren't sites never reach it.
  const env = { DB: {}, SITE_URL: 'https://framed.my.id' } as unknown as Env

  it.each(['/', '/login', '/api/me', '/assets/index.js'])('passes %s straight through', async (path) => {
    const page = new Response('<html></html>', { headers: { 'Content-Type': 'text/html' } })
    const next = vi.fn(async () => page)
    expect(await withLinkPreview(new Request(`https://framed.my.id${path}`), env, next)).toBe(page)
    expect(next).toHaveBeenCalledOnce()
  })

  it('sends the page unchanged when the preview fails', async () => {
    const page = new Response('<html></html>', { headers: { 'Content-Type': 'text/html' } })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const sent = await withLinkPreview(new Request('https://framed.my.id/alex'), env, async () => page)
    expect(sent).toBe(page)
    vi.restoreAllMocks()
  })
})
