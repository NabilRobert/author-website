/** The Cloudflare bindings the API uses, as set in wrangler.toml. */
export interface Env {
  /** The site's content (D1). */
  DB: D1Database
}
