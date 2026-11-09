/** The Cloudflare bindings and settings the API uses (wrangler.toml, .dev.vars). */
export interface Env {
  /** The site's content (D1). */
  DB: D1Database
  /** Uploaded images: covers, photos, banner pictures (R2). */
  IMAGES: R2Bucket
  /** The Cloudflare Access team domain, like "myteam.cloudflareaccess.com". */
  ACCESS_TEAM_DOMAIN?: string
  /** The Access application's audience tag (AUD), from its settings page. */
  ACCESS_AUD?: string
  /**
   * "true" lets the editor save without signing in, but only on
   * localhost: for local development, set in .dev.vars, never in production.
   */
  LOCAL_DEV_NO_LOGIN?: string
}
