// @vitest-environment node
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { clientIpOf } from '../../server/node/client-ip'
import { createNodeServer } from '../../server/node/server'
import { createTestApp } from './test-app'
import type { TestApp } from './test-app'

const CLOUDFLARE_EDGE = '162.158.1.1'
const VISITOR = '198.51.100.7'

const ipFrom = (headers: Record<string, string>) => clientIpOf(new Headers(headers))

describe("the visitor's address on the Node version", () => {
  it("trusts Cloudflare's CF-Connecting-IP when Cloudflare connected", () => {
    expect(ipFrom({ 'x-forwarded-for': CLOUDFLARE_EDGE, 'cf-connecting-ip': VISITOR })).toBe(VISITOR)
  })

  it('uses the connecting address when someone skips Cloudflare, whatever header they send', () => {
    expect(ipFrom({ 'x-forwarded-for': '203.0.113.9', 'cf-connecting-ip': VISITOR })).toBe('203.0.113.9')
  })

  it('reads only the last hop, which the proxy added, not what the visitor wrote before it', () => {
    expect(ipFrom({ 'x-forwarded-for': `${CLOUDFLARE_EDGE}, 203.0.113.9`, 'cf-connecting-ip': VISITOR })).toBe(
      '203.0.113.9',
    )
  })

  it('knows no address when no proxy said who connected', () => {
    expect(ipFrom({ 'cf-connecting-ip': VISITOR })).toBeUndefined()
  })
})

describe('the Node server', () => {
  let api: TestApp
  let distDir: string

  beforeEach(async () => {
    api = await createTestApp()
    distDir = mkdtempSync(join(tmpdir(), 'framed-dist-'))
    writeFileSync(join(distDir, 'index.html'), '<html><head><title>Framed</title></head></html>')
    writeFileSync(join(distDir, '_headers'), '/*\n  X-Frame-Options: DENY\n')
    writeFileSync(join(distDir, '_routes.json'), '{}')
  })
  afterEach(async () => {
    await api.dispose()
  })

  it('rate-limits a direct attacker even when they change CF-Connecting-IP every time', async () => {
    const server = createNodeServer(distDir)
    const statuses: number[] = []
    for (let attempt = 1; attempt <= 6; attempt++) {
      const request = new Request('http://localhost/api/auth/sign-in/email', {
        method: 'POST',
        body: JSON.stringify({ email: 'mara@example.com', password: `wrong-guess-${attempt}` }),
        headers: {
          'Content-Type': 'application/json',
          Origin: api.env.SITE_URL,
          'x-forwarded-for': '203.0.113.9',
          'cf-connecting-ip': `192.0.2.${attempt}`,
        },
      })
      statuses.push((await server.fetch(request, api.env)).status)
    }
    expect(statuses).toContain(429)
  })

  it("doesn't serve the Cloudflare build files", async () => {
    const server = createNodeServer(distDir)
    for (const path of ['/_headers', '/_routes.json']) {
      expect((await server.fetch(new Request(`http://localhost${path}`), api.env)).status).toBe(404)
    }
  })
})
