/**
 * Local development only:
 *
 *   GET /api/dev/test-login   log in as the test user and open /test/edit
 *
 * It answers only when LOCAL_DEV_TEST_LOGIN is "true" (set in .dev.vars,
 * never in production) AND the request is to localhost; otherwise it does
 * not exist (404). It uses the real login path: it asks Better Auth for a
 * code, keeps the code instead of emailing it, and logs in with it, so
 * there is no shortcut session.
 */
import { Hono } from 'hono'
import { createAuth } from './auth'
import type { AppEnv } from './session'

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1'])
// Created by `npm run db:seed:test` (scripts/seed-test-site.ts).
const TEST_EMAIL = 'test@framed.local'
const TEST_EDITOR = '/test/edit'

export const devRoutes = new Hono<AppEnv>()

devRoutes.get('/test-login', async (c) => {
  const isAllowed = c.env.LOCAL_DEV_TEST_LOGIN === 'true' && LOCAL_HOSTNAMES.has(new URL(c.req.url).hostname)
  if (!isAllowed) return c.notFound()

  let code = ''
  const auth = createAuth(c.env, async (_email, sentCode) => void (code = sentCode))
  await auth.api.sendVerificationOTP({ body: { email: TEST_EMAIL, type: 'sign-in' } })
  const login = await auth.api.signInEmailOTP({ body: { email: TEST_EMAIL, otp: code }, asResponse: true })
  if (!login.ok) return c.text('Test login failed. Run `npm run db:seed:test` first.', 500)

  const headers = new Headers({ Location: TEST_EDITOR })
  for (const cookie of login.headers.getSetCookie()) headers.append('Set-Cookie', cookie)
  return new Response(null, { status: 302, headers })
})
