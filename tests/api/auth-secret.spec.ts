// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestApp, PASSWORD } from './test-app'
import type { TestApp } from './test-app'

let api: TestApp
beforeEach(async () => {
  api = await createTestApp()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(async () => {
  vi.restoreAllMocks()
  await api.dispose()
})

// A preview deploy, or production before its secrets are added.
describe('a deployment without a real BETTER_AUTH_SECRET', () => {
  it.each([
    ['missing', undefined],
    ['shorter than 32 characters', 'too-short-secret'],
    ["Better Auth's public default", 'better-auth-secret-12345678901234567890'],
  ])('refuses every API request when the secret is %s', async (_case, secret) => {
    ;(api.env as { BETTER_AUTH_SECRET?: string }).BETTER_AUTH_SECRET = secret
    for (const path of ['/api/sites/mara/content', '/api/me', '/api/sign-up']) {
      const response = await api.request(path)
      expect(response.status).toBe(503)
      expect(await response.json()).toEqual({ error: "Framed isn't set up on this address yet." })
    }
  })

  it('creates no account and touches no data', async () => {
    delete (api.env as { BETTER_AUTH_SECRET?: string }).BETTER_AUTH_SECRET
    const signUp = await api.postJson('/api/auth/sign-up/email', {
      email: 'sam@example.com',
      password: PASSWORD,
      name: '',
    })
    expect(signUp.status).toBe(503)
    const users = await api.db.prepare('SELECT COUNT(*) AS count FROM "user"').first<{ count: number }>()
    expect(users?.count).toBe(0)
  })

  it('says what to fix in the logs, not to visitors', async () => {
    delete (api.env as { BETTER_AUTH_SECRET?: string }).BETTER_AUTH_SECRET
    await api.request('/api/me')
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('BETTER_AUTH_SECRET is not set'))
  })
})
