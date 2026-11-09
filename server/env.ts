/** The Cloudflare bindings and settings the API uses (wrangler.toml, .dev.vars, secrets). */
export interface Env {
  /** Everyone's accounts and sites (D1). */
  DB: D1Database
  /** Uploaded pictures and PDFs (R2). Optional: without it uploads are off (server/storage.ts). */
  IMAGES?: R2Bucket
  /** The site's own address, like "https://framed.my.id"; login cookies are set for it. */
  SITE_URL: string
  /** Signs login sessions (secret; at least 32 random characters, checked by secretProblem). */
  BETTER_AUTH_SECRET: string
  /** Sends the login codes (secret, from resend.com). */
  RESEND_API_KEY?: string
  /** The sender of login codes, like "Framed <login@framed.my.id>". */
  EMAIL_FROM?: string
  /** "open" lets anyone sign up; anything else ("invite", or unset) needs an invite (server/invites.ts). */
  SIGN_UP_MODE?: string
  /** "true" prints emailed codes in the terminal instead of sending them: local development only. */
  LOCAL_DEV_PRINT_CODES?: string
}

export const MIN_SECRET_LENGTH = 32
// Better Auth's built-in fallback (better-auth/dist/utils/constants.mjs). It
// is public, and Better Auth only refuses it when NODE_ENV is "production",
// which Cloudflare Pages doesn't set, so Framed refuses it itself.
const BETTER_AUTH_DEFAULT_SECRET = 'better-auth-secret-12345678901234567890'

/**
 * What is wrong with BETTER_AUTH_SECRET, or null if it is usable. Without a
 * real one, a deployment (a preview, or production before its secrets are
 * added) must not run at all: Better Auth would sign with a public secret.
 */
export function secretProblem(env: Env): string | null {
  const secret = env.BETTER_AUTH_SECRET ?? ''
  if (!secret)
    return 'BETTER_AUTH_SECRET is not set: add it as an encrypted secret on the Pages project (README, step 6).'
  if (secret === BETTER_AUTH_DEFAULT_SECRET)
    return "BETTER_AUTH_SECRET is Better Auth's public default: replace it with `openssl rand -base64 32`."
  if (secret.length < MIN_SECRET_LENGTH)
    return `BETTER_AUTH_SECRET is shorter than ${MIN_SECRET_LENGTH} characters: replace it with \`openssl rand -base64 32\`.`
  return null
}
