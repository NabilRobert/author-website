/**
 * Deletes a person completely: their pictures in R2, their site's content,
 * their site, their logins and their account. Nothing is kept.
 */
import type { Env } from './env'
import { findSiteByOwner } from './sites'

const SITE_TABLES = ['blocks', 'pages', 'news', 'reviews', 'buy_links', 'books', 'social_links', 'theme', 'author']
const SITE_RECORDS = ['images', 'reports']

export async function deleteAccount(env: Env, userId: string): Promise<void> {
  const site = await findSiteByOwner(env.DB, userId)
  if (site) {
    const images = await env.DB.prepare('SELECT key FROM images WHERE site_id = ?').bind(site.id).all<{ key: string }>()
    const keys = images.results.map((image) => image.key)
    if (keys.length) await env.IMAGES.delete(keys)
  }
  const bySite = (table: string) => env.DB.prepare(`DELETE FROM ${table} WHERE site_id = ?`).bind(site?.id ?? '')
  await env.DB.batch([
    ...[...SITE_TABLES, ...SITE_RECORDS].map(bySite),
    env.DB.prepare('DELETE FROM sites WHERE owner_user_id = ?').bind(userId),
    env.DB.prepare('DELETE FROM session WHERE "userId" = ?').bind(userId),
    env.DB.prepare('DELETE FROM account WHERE "userId" = ?').bind(userId),
    env.DB.prepare('DELETE FROM "user" WHERE id = ?').bind(userId),
  ])
}
