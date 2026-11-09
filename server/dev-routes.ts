/**
 * Local development only:
 *
 *   GET /api/dev/test-login   log in as the test user and open /test/edit
 *
 * Every /api/dev/* address sits behind `localDevOnly`, which answers 404
 * (as if the address didn't exist) unless ALL of these hold:
 *   - LOCAL_DEV_TEST_LOGIN is exactly "true" (set only in the local
 *     .dev.vars; a missing or other value refuses);
 *   - SITE_URL, from the deploy config, is a localhost address (a request
 *     can't change it, unlike its Host header);
 *   - the request itself is to localhost.
 * Tests check each rule, and that wrangler.toml never sets the variable.
 * The login uses the real path: it asks Better Auth for a code, keeps it
 * instead of emailing it, and logs in with it, so no session is faked.
 */
import { Hono } from 'hono'
import { createMiddleware } from 'hono/factory'
import { createAuth } from './auth'
import type { Env } from './env'
import type { AppEnv } from './session'

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1'])
// Created by `npm run db:seed:test` (scripts/seed-test-site.ts).
const TEST_EMAIL = 'test@framed.local'
const TEST_EDITOR = '/test/edit'

function isLocalhost(url: string): boolean {
  try {
    return LOCAL_HOSTNAMES.has(new URL(url).hostname)
  } catch {
    return false
  }
}

/** True only on a local development server with the test login switched on. */
export function isLocalDev(env: Env, requestUrl: string): boolean {
  return env.LOCAL_DEV_TEST_LOGIN === 'true' && isLocalhost(env.SITE_URL ?? '') && isLocalhost(requestUrl)
}

const localDevOnly = createMiddleware<AppEnv>(async (c, next) => {
  if (!isLocalDev(c.env, c.req.url)) return c.notFound()
  await next()
})

export const devRoutes = new Hono<AppEnv>()

devRoutes.use('*', localDevOnly)

devRoutes.get('/test-login', async (c) => {
  let code = ''
  const auth = createAuth(c.env, async (_email, sentCode) => void (code = sentCode))
  await auth.api.sendVerificationOTP({ body: { email: TEST_EMAIL, type: 'sign-in' } })
  const login = await auth.api.signInEmailOTP({ body: { email: TEST_EMAIL, otp: code }, asResponse: true })
  if (!login.ok) return c.text('Test login failed. Run `npm run db:seed:test` first.', 500)

  const headers = new Headers({ Location: TEST_EDITOR })
  for (const cookie of login.headers.getSetCookie()) headers.append('Set-Cookie', cookie)
  return new Response(null, { status: 302, headers })
})
