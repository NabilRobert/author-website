/** The Cloudflare bindings and settings the API uses (wrangler.toml, .dev.vars, secrets). */
export interface Env {
  /** Everyone's accounts and sites (D1). */
  DB: D1Database
  /** Uploaded pictures (R2). */
  IMAGES: R2Bucket
  /** The site's own address, like "https://framed.my.id"; login cookies are set for it. */
  SITE_URL: string
  /** Signs login sessions (secret; at least 32 random characters). */
  BETTER_AUTH_SECRET: string
  /** Sends the login codes (secret, from resend.com). */
  RESEND_API_KEY?: string
  /** The sender of login codes, like "Framed <login@framed.my.id>". */
  EMAIL_FROM?: string
  /** "true" prints login codes in the terminal instead of emailing them: local development only. */
  LOCAL_DEV_PRINT_CODES?: string
  /**
   * "true" turns on /api/dev/test-login (one-click login as the local test
   * user, server/dev-routes.ts). Local .dev.vars only; it also refuses any
   * host but localhost.
   */
  LOCAL_DEV_TEST_LOGIN?: string
}
