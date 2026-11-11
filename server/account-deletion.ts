/**
 * Deletes a person completely: their uploaded pictures and files, their site's content,
 * their site, their logins and their account. Nothing is kept.
 */
import type { Env } from './env'
import { findSiteByOwner } from './sites'
import { SITE_CONTENT_TABLES } from './content-write'

const SITE_RECORDS = ['images', 'reports', 'contact_messages', 'visits']

export async function deleteAccount(env: Env, userId: string): Promise<void> {
  const site = await findSiteByOwner(env.DB, userId)
  if (site) {
    const images = await env.DB.prepare('SELECT key FROM images WHERE site_id = ?').bind(site.id).all<{ key: string }>()
    const keys = images.results.map((image) => image.key)
    if (keys.length && env.IMAGES) await env.IMAGES.delete(keys)
  }
  const bySite = (table: string) => env.DB.prepare(`DELETE FROM ${table} WHERE site_id = ?`).bind(site?.id ?? '')
  await env.DB.batch([
    ...[...SITE_CONTENT_TABLES, ...SITE_RECORDS].map(bySite),
    env.DB.prepare('DELETE FROM sites WHERE owner_user_id = ?').bind(userId),
    env.DB.prepare('DELETE FROM session WHERE "userId" = ?').bind(userId),
    env.DB.prepare('DELETE FROM account WHERE "userId" = ?').bind(userId),
    env.DB.prepare('DELETE FROM "user" WHERE id = ?').bind(userId),
  ])
}
