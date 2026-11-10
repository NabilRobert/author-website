/**
 * A per-account lockout on top of Better Auth's per-address rate limits
 * (server/auth.ts). Those count guesses by visitor address, so someone with
 * many addresses could keep guessing one account's password; this counts
 * wrong passwords per account, wherever they come from.
 *
 *   POST /api/auth/sign-in/email              refused while the account is locked
 *   POST /api/auth/email-otp/reset-password   a successful reset unlocks it
 *
 * The trade-off: anyone who knows an email can lock that account for a
 * while. Resetting the password still works, so the owner is never stuck.
 */
import { createMiddleware } from 'hono/factory'
import type { AppEnv } from './session'

export const WRONG_PASSWORDS_BEFORE_LOCK = 10
const LOCK_MINUTES = 15
const LOCKED =
  'Too many wrong passwords for this account. Wait 15 minutes, or use "Forgot your password?" to set a new one.'
// What Better Auth answers for a wrong email or password.
const WRONG_PASSWORD_STATUS = 401

async function emailIn(request: Request): Promise<string> {
  const body = (await request
    .clone()
    .json()
    .catch(() => ({}))) as { email?: unknown }
  return String(body.email ?? '')
    .trim()
    .toLowerCase()
}

/** Refuses a login for a locked account, and counts each wrong password. */
export const guardSignIn = createMiddleware<AppEnv>(async (c, next) => {
  const db = c.env.DB
  const email = await emailIn(c.req.raw)
  const windowStart = new Date(Date.now() - LOCK_MINUTES * 60 * 1000).toISOString()
  const recent = await db
    .prepare('SELECT COUNT(*) AS count FROM sign_in_failures WHERE email = ? AND failed_at > ?')
    .bind(email, windowStart)
    .first<{ count: number }>()
  if ((recent?.count ?? 0) >= WRONG_PASSWORDS_BEFORE_LOCK) return c.json({ message: LOCKED, code: 'LOCKED' }, 429)
  await next()
  if (c.res.status === WRONG_PASSWORD_STATUS) {
    await db.batch([
      db.prepare('DELETE FROM sign_in_failures WHERE email = ? AND failed_at <= ?').bind(email, windowStart),
      db.prepare('INSERT INTO sign_in_failures (email, failed_at) VALUES (?, ?)').bind(email, new Date().toISOString()),
    ])
  } else if (c.res.ok) {
    await clearFailures(db, email)
  }
})

/** After a successful password reset, the account is unlocked. */
export const unlockOnReset = createMiddleware<AppEnv>(async (c, next) => {
  const email = await emailIn(c.req.raw)
  await next()
  if (c.res.ok) await clearFailures(c.env.DB, email)
})

async function clearFailures(db: D1Database, email: string) {
  await db.prepare('DELETE FROM sign_in_failures WHERE email = ?').bind(email).run()
}
