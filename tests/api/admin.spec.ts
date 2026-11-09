// @vitest-environment node
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { exportJWK, generateKeyPair, SignJWT } from 'jose'
import { app } from '../../server/app'
import type { Env } from '../../server/env'
import { saveContent } from '../../server/content-write'
import { demoContent } from '../../shared/demo-content'
import { createTestDatabase } from './test-database'

const TEAM = 'author-test.cloudflareaccess.com'
const AUD = 'test-audience-tag'
const KEY_ID = 'test-key'

let privateKey: CryptoKey
let otherPrivateKey: CryptoKey
let publicJwk: Record<string, unknown>
let db: D1Database
let images: R2Bucket
let dispose: () => Promise<void>

beforeAll(async () => {
  const pair = await generateKeyPair('RS256')
  privateKey = pair.privateKey
  otherPrivateKey = (await generateKeyPair('RS256')).privateKey
  publicJwk = { ...(await exportJWK(pair.publicKey)), kid: KEY_ID, alg: 'RS256' }
})

beforeEach(async () => {
  ;({ db, images, dispose } = await createTestDatabase())
  // Access's public keys, as https://<team>/cdn-cgi/access/certs serves them.
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ keys: [publicJwk] })),
  )
})

afterEach(async () => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  await dispose()
})

function accessToken({ key = privateKey, audience = AUD, issuer = `https://${TEAM}`, expiresIn = '1h' } = {}) {
  return new SignJWT({ email: 'owner@example.com' })
    .setProtectedHeader({ alg: 'RS256', kid: KEY_ID })
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key)
}

const productionEnv = (): Env => ({ DB: db, IMAGES: images, ACCESS_TEAM_DOMAIN: TEAM, ACCESS_AUD: AUD })

async function request(path: string, init: RequestInit, env: Env, host = 'https://author.example') {
  return app.request(`${host}${path}`, init, env)
}

async function signedIn(path: string, init: RequestInit = {}) {
  const headers = { 'Cf-Access-Jwt-Assertion': await accessToken(), 'Content-Type': 'application/json' }
  return request(path, { ...init, headers }, productionEnv())
}

describe('editor API sign-in check', () => {
  it('lets a valid Access token through', async () => {
    await saveContent(db, demoContent, new Date())
    const response = await signedIn('/api/admin/content')
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })

  it('refuses a request without a token', async () => {
    const response = await request('/api/admin/content', {}, productionEnv())
    expect(response.status).toBe(401)
  })

  it.each([
    ['signed with another key', { key: undefined as unknown as CryptoKey, other: true }],
    ['for another application', { audience: 'someone-else' }],
    ['from another team', { issuer: 'https://evil.cloudflareaccess.com' }],
    ['expired', { expiresIn: '-1m' }],
  ])('refuses a token %s', async (_case, options) => {
    const { other, ...tokenOptions } = options as { other?: boolean; key?: CryptoKey }
    const token = await accessToken({ ...tokenOptions, key: other ? otherPrivateKey : privateKey })
    const response = await request(
      '/api/admin/content',
      { headers: { 'Cf-Access-Jwt-Assertion': token } },
      productionEnv(),
    )
    expect(response.status).toBe(401)
  })

  it('fails closed when Access is not configured', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const response = await request('/api/admin/content', {}, { DB: db, IMAGES: images })
    expect(response.status).toBe(503)
  })

  it('allows editing without sign-in only on localhost with the local-dev setting', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const localEnv = { DB: db, IMAGES: images, LOCAL_DEV_NO_LOGIN: 'true' }
    await saveContent(db, demoContent, new Date())
    expect((await request('/api/admin/content', {}, localEnv, 'http://localhost:5173')).status).toBe(200)
    expect((await request('/api/admin/content', {}, localEnv, 'https://author.example')).status).toBe(503)
  })

  it('does not guard the public content', async () => {
    await saveContent(db, demoContent, new Date())
    expect((await request('/api/content', {}, productionEnv())).status).toBe(200)
  })
})

describe('PUT /api/admin/content', () => {
  it('saves the site and returns it with a new updatedAt', async () => {
    const response = await signedIn('/api/admin/content', { method: 'PUT', body: JSON.stringify(demoContent) })
    expect(response.status).toBe(200)
    const saved = (await response.json()) as { updatedAt: string }
    expect(saved.updatedAt).not.toBe('')
    const reread = await signedIn('/api/admin/content')
    expect(await reread.json()).toEqual(saved)
  })

  it('lists the fields to fix when the content is invalid', async () => {
    const author = { ...demoContent.author, contactEmail: 'not an email' }
    const response = await signedIn('/api/admin/content', {
      method: 'PUT',
      body: JSON.stringify({ ...demoContent, author }),
    })
    expect(response.status).toBe(400)
    const body = (await response.json()) as { issues: { path: unknown[]; message: string }[] }
    expect(body.issues).toEqual([
      { path: ['author', 'contactEmail'], message: 'Enter an email address like name@example.com.' },
    ])
  })

  it('answers a body that is not JSON with the same plain 400', async () => {
    const response = await signedIn('/api/admin/content', { method: 'PUT', body: 'not json{' })
    expect(response.status).toBe(400)
  })

  it('refuses a save from an older copy with 409', async () => {
    await saveContent(db, demoContent, new Date())
    const response = await signedIn('/api/admin/content', { method: 'PUT', body: JSON.stringify(demoContent) })
    expect(response.status).toBe(409)
  })

  it('refuses a body over 1 MB with 413 before reading it', async () => {
    const author = { ...demoContent.author, bioShort: 'x'.repeat(1024 * 1024) }
    const response = await signedIn('/api/admin/content', {
      method: 'PUT',
      body: JSON.stringify({ ...demoContent, author }),
    })
    expect(response.status).toBe(413)
  })

  it('refuses a save without sign-in', async () => {
    const response = await request(
      '/api/admin/content',
      { method: 'PUT', body: JSON.stringify(demoContent) },
      productionEnv(),
    )
    expect(response.status).toBe(401)
    expect((await request('/api/content', {}, productionEnv())).status).toBe(404)
  })
})
