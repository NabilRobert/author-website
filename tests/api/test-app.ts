/**
 * The API on a real local D1 and R2 (tests/api/test-database.ts), with
 * login codes kept in a map instead of emailed, and a helper that logs a
 * person in the way the login page does.
 */
import { createApp } from '../../server/app'
import type { Env } from '../../server/env'
import { createTestDatabase } from './test-database'

export const ORIGIN = 'http://localhost:8788'

export async function createTestApp() {
  const { db, images, dispose } = await createTestDatabase()
  const codes = new Map<string, string>()
  const app = createApp({ loginCodeSenderFor: () => async (email, code) => void codes.set(email, code) })
  const env: Env = { DB: db, IMAGES: images, SITE_URL: ORIGIN, BETTER_AUTH_SECRET: 'test-secret-0123456789-abcdefghij' }

  function request(path: string, init: RequestInit = {}, cookie = '') {
    const headers = new Headers(init.headers)
    if (!headers.has('Origin')) headers.set('Origin', ORIGIN)
    if (cookie) headers.set('Cookie', cookie)
    return app.request(`${ORIGIN}${path}`, { ...init, headers }, env)
  }

  function postJson(path: string, body: unknown, cookie = '') {
    return request(
      path,
      { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } },
      cookie,
    )
  }

  /** Logs in with an emailed code and returns the login cookie. */
  async function logIn(email: string): Promise<string> {
    await postJson('/api/auth/email-otp/send-verification-otp', { email, type: 'sign-in' })
    const response = await postJson('/api/auth/sign-in/email-otp', { email, otp: codes.get(email) })
    if (!response.ok) throw new Error(`Login failed: ${response.status} ${await response.text()}`)
    return response.headers
      .getSetCookie()
      .map((cookie) => cookie.split(';')[0])
      .join('; ')
  }

  /** Logs in and claims a site name; returns the login cookie. */
  async function signUp(email: string, name: string): Promise<string> {
    const cookie = await logIn(email)
    const response = await postJson('/api/me/site', { name }, cookie)
    if (response.status !== 201) throw new Error(`Claiming ${name} failed: ${await response.text()}`)
    return cookie
  }

  return { app, env, db, codes, request, postJson, logIn, signUp, dispose }
}

export type TestApp = Awaited<ReturnType<typeof createTestApp>>
