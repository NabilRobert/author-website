/**
 * The API on a real local D1 and R2 (tests/api/test-database.ts), with
 * emailed codes kept in a map instead of sent, a stand-in for the leaked-
 * password service (no network in tests), and helpers that sign people up
 * and log them in the way the login page does.
 */
import { vi } from 'vitest'
import { createApp } from '../../server/app'
import type { Env } from '../../server/env'
import type { OutgoingMessage } from '../../server/email'
import { createTestDatabase } from './test-database'

export const ORIGIN = 'http://localhost:8788'
export const PASSWORD = 'correct horse battery staple'
const PWNED_RANGE_URL = 'https://api.pwnedpasswords.com/range/'

/**
 * Answers the haveIBeenPwned range API like the real one: every leaked
 * password whose SHA-1 hash starts with the asked-for 5 characters, as
 * "REST-OF-HASH:COUNT" lines. Other requests go to the real fetch.
 */
function fakeLeakedPasswordService(leakedPasswords: Set<string>) {
  const realFetch = globalThis.fetch
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input)
    if (!url.startsWith(PWNED_RANGE_URL)) return realFetch(input, init)
    const prefix = url.slice(PWNED_RANGE_URL.length)
    const lines: string[] = []
    for (const password of leakedPasswords) {
      const hash = await sha1(password)
      if (hash.startsWith(prefix)) lines.push(`${hash.slice(5)}:42`)
    }
    return new Response(lines.join('\r\n'))
  })
}

async function sha1(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0').toUpperCase()).join('')
}

const cookieFrom = (response: Response) =>
  response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(';')[0])
    .join('; ')

export async function createTestApp() {
  const { db, images, sqlite, dispose } = await createTestDatabase()
  const codes = new Map<string, string>()
  const leakedPasswords = new Set<string>()
  fakeLeakedPasswordService(leakedPasswords)
  const sentMessages: OutgoingMessage[] = []
  const app = createApp({
    emailCodeSenderFor: () => async (email, code) => void codes.set(email, code),
    contactMessageSenderFor: () => async (message) => void sentMessages.push(message),
  })
  const env: Env = {
    DB: db,
    IMAGES: images,
    SITE_URL: ORIGIN,
    BETTER_AUTH_SECRET: 'test-secret-0123456789-abcdefghij',
    // Most tests sign people up freely; tests/api/invites.spec.ts switches invites on.
    SIGN_UP_MODE: 'open',
    SQLITE_DATABASE: sqlite,
  }

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

  /** Signs up with PASSWORD and confirms the email with its code; returns the login cookie. */
  async function createAccount(email: string): Promise<string> {
    const signUp = await postJson('/api/auth/sign-up/email', { email, password: PASSWORD, name: '' })
    if (!signUp.ok) throw new Error(`Sign-up failed: ${signUp.status} ${await signUp.text()}`)
    const verified = await postJson('/api/auth/email-otp/verify-email', { email, otp: codes.get(email) })
    if (!verified.ok) throw new Error(`Confirming the email failed: ${verified.status} ${await verified.text()}`)
    return cookieFrom(verified)
  }

  /** Logs in with PASSWORD, creating the account the first time; returns the login cookie. */
  async function logIn(email: string): Promise<string> {
    const response = await postJson('/api/auth/sign-in/email', { email, password: PASSWORD })
    if (response.status === 401) return createAccount(email)
    if (!response.ok) throw new Error(`Login failed: ${response.status} ${await response.text()}`)
    return cookieFrom(response)
  }

  /** Logs in and claims a site name; returns the login cookie. */
  async function signUp(email: string, name: string): Promise<string> {
    const cookie = await logIn(email)
    const response = await postJson('/api/me/site', { name }, cookie)
    if (response.status !== 201) throw new Error(`Claiming ${name} failed: ${await response.text()}`)
    return cookie
  }

  const disposeAll = async () => {
    vi.unstubAllGlobals()
    await dispose()
  }
  return { app, env, db, codes, sentMessages, leakedPasswords, request, postJson, logIn, signUp, dispose: disposeAll }
}

export type TestApp = Awaited<ReturnType<typeof createTestApp>>
