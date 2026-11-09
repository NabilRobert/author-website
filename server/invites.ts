/**
 * Invite-only sign-up. While SIGN_UP_MODE isn't "open" (wrangler.toml sets
 * "invite"; a missing setting counts as invite-only, so it fails closed),
 * signing up needs an unused invite code, sent by the login page in the
 * X-Framed-Invite header:
 *
 *   GET  /api/sign-up             whether sign-up needs an invite
 *   POST /api/auth/sign-up/email  checked here first (guardSignUp), then Better Auth
 *
 * The invite is only used up once the sign-up succeeds, so a refused
 * password doesn't waste it. Invites are made with `npm run invite`
 * (scripts/create-invite.ts). Logging in never needs one.
 */
import { Hono } from 'hono'
import { createMiddleware } from 'hono/factory'
import type { Env } from './env'
import type { AppEnv } from './session'

export const INVITE_HEADER = 'X-Framed-Invite'
// No 0/O or 1/I/L, so a code read aloud or copied by hand comes out right.
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
const CODE_LENGTH = 8

const NEEDS_INVITE = 'Framed is invite-only for now. Use the link from your invite, or ask for one.'
const BAD_INVITE = "That invite code isn't valid, or it has been used. Ask for a new one."
const WRONG_EMAIL = 'This invite is for a different email address. Sign up with the address it was sent to.'

export function isInviteOnly(env: Env): boolean {
  return env.SIGN_UP_MODE !== 'open'
}

/** A fresh random code, like "K7Q2M9XW". */
export function newInviteCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH))
  return [...bytes].map((byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('')
}

/** "k7q2-m9xw " → "K7Q2M9XW": what people type, as stored. */
export function normaliseInviteCode(typed: string): string {
  return typed.toUpperCase().replace(/[^0-9A-Z]/g, '')
}

export const signUpRoutes = new Hono<AppEnv>()

signUpRoutes.get('/sign-up', (c) => c.json({ isInviteOnly: isInviteOnly(c.env) }))

/** Runs before Better Auth's sign-up: refuses it without a usable invite, and uses the invite up after. */
export const guardSignUp = createMiddleware<AppEnv>(async (c, next) => {
  if (!isInviteOnly(c.env)) return next()
  const code = normaliseInviteCode(c.req.header(INVITE_HEADER) ?? '')
  const body = (await c.req.raw
    .clone()
    .json()
    .catch(() => ({}))) as { email?: unknown }
  const refusal = await checkInvite(c.env.DB, code, String(body.email ?? ''))
  if (refusal) return c.json({ message: refusal, code: 'INVITE_REQUIRED' }, 403)
  await next()
  if (c.res.ok) {
    await c.env.DB.prepare('UPDATE invites SET used_at = ? WHERE code = ? AND used_at IS NULL')
      .bind(new Date().toISOString(), code)
      .run()
  }
})

// Why this code can't be used to sign up as `email`, or null if it can.
async function checkInvite(db: D1Database, code: string, email: string): Promise<string | null> {
  if (!code) return NEEDS_INVITE
  const invite = await db
    .prepare('SELECT email, used_at FROM invites WHERE code = ?')
    .bind(code)
    .first<{ email: string | null; used_at: string | null }>()
  if (!invite || invite.used_at) return BAD_INVITE
  if (invite.email && invite.email.toLowerCase() !== email.trim().toLowerCase()) return WRONG_EMAIL
  return null
}
