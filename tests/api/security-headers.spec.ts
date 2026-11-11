// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseHeadersFile } from '../../server/node/server'

// public/_headers is copied into the build, and both Cloudflare Pages and
// the Node version (server/node/server.ts) send it with every page.
const headers = new Map(parseHeadersFile(readFileSync(join(import.meta.dirname, '../../public/_headers'), 'utf8')))
const csp = headers.get('Content-Security-Policy') ?? ''

describe('the security headers every page gets', () => {
  it('keep browsers on https', () => {
    expect(headers.get('Strict-Transport-Security')).toMatch(/max-age=31536000/)
  })

  it("run only Framed's own scripts, and allow no plugins or other sites framing it", () => {
    expect(csp).toContain("script-src 'self'")
    expect(csp).not.toMatch(/script-src[^;]*unsafe/)
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("frame-ancestors 'none'")
  })

  it('let the video block embed its two players', () => {
    expect(csp).toContain('frame-src https://www.youtube-nocookie.com https://player.vimeo.com')
  })
})
