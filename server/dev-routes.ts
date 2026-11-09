/**
 * Local development only:
 *
 *   POST /api/dev/test-account-login   log in as the test account without a code
 *                                      (the login form uses it for test@framed.local)
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
import { TEST_ACCOUNT_EMAIL } from '../shared/test-account'
import { createAuth } from './auth'
import type { Env } from './env'
import type { AppEnv } from './session'

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1'])

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

devRoutes.post('/test-account-login', async (c) => {
  let code = ''
  const auth = createAuth(c.env, async (_email, sentCode) => void (code = sentCode))
  await auth.api.sendVerificationOTP({ body: { email: TEST_ACCOUNT_EMAIL, type: 'sign-in' } })
  const login = await auth.api.signInEmailOTP({ body: { email: TEST_ACCOUNT_EMAIL, otp: code }, asResponse: true })
  if (!login.ok) return c.json({ error: 'Test login failed. Run `npm run db:seed:test` first.' }, 500)

  const headers = new Headers({ 'Content-Type': 'application/json' })
  for (const cookie of login.headers.getSetCookie()) headers.append('Set-Cookie', cookie)
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers })
})
