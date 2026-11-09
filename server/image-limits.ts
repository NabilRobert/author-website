/**
 * Each site's picture allowance, and tidying up pictures nobody uses.
 *
 * Every upload is recorded in the `images` table with its site and size.
 * After each save, pictures the site no longer uses are deleted, so the
 * allowance counts what is really there. A picture uploaded in the last day
 * is kept even if unused: the owner may not have saved yet.
 */
import type { Block } from '../shared/blocks'
import type { SiteContent } from '../shared/schema'
import type { Env } from './env'

export const MAX_IMAGES_PER_SITE = 200
export const MAX_IMAGE_BYTES_PER_SITE = 200 * 1024 * 1024
const UNSAVED_GRACE_MS = 24 * 60 * 60 * 1000

/** Why this upload would go over the site's allowance, or null if it fits. */
export async function checkImageAllowance(db: D1Database, siteId: string, bytes: number): Promise<string | null> {
  const usage = await db
    .prepare('SELECT COUNT(*) AS count, COALESCE(SUM(bytes), 0) AS total FROM images WHERE site_id = ?')
    .bind(siteId)
    .first<{ count: number; total: number }>()
  if ((usage?.count ?? 0) >= MAX_IMAGES_PER_SITE) {
    return `Your site has ${MAX_IMAGES_PER_SITE} pictures, the most it can hold. Remove some from your pages and save first.`
  }
  if ((usage?.total ?? 0) + bytes > MAX_IMAGE_BYTES_PER_SITE) {
    return 'Your pictures have used the 200 MB your site can hold. Remove some from your pages and save first.'
  }
  return null
}

export async function recordImage(db: D1Database, siteId: string, key: string, bytes: number, now: Date) {
  await db
    .prepare('INSERT INTO images (key, site_id, bytes, created_at) VALUES (?, ?, ?, ?)')
    .bind(key, siteId, bytes, now.toISOString())
    .run()
}

export async function pruneUnusedImages(env: Env, siteId: string, content: SiteContent, now: Date) {
  const inUse = usedImageKeys(content)
  const cutoff = new Date(now.getTime() - UNSAVED_GRACE_MS).toISOString()
  const older = await env.DB.prepare('SELECT key FROM images WHERE site_id = ? AND created_at < ?')
    .bind(siteId, cutoff)
    .all<{ key: string }>()
  const unused = older.results.map((row) => row.key).filter((key) => !inUse.has(key))
  if (!unused.length) return
  await env.IMAGES.delete(unused)
  await env.DB.batch(unused.map((key) => env.DB.prepare('DELETE FROM images WHERE key = ?').bind(key)))
}

/** The pictures one block shows: its own, or a gallery's. */
function blockImageKeys(block: Block): (string | null)[] {
  if (block.type === 'gallery') return block.pictures.map((picture) => picture.imageKey)
  return 'imageKey' in block ? [block.imageKey] : []
}

/** Every picture the site shows anywhere. */
export function usedImageKeys(content: SiteContent): Set<string> {
  const keys = [
    content.profile.photoKey,
    content.theme.backgroundImageKey,
    ...content.works.map((work) => work.imageKey),
    ...content.works.flatMap((work) => work.pageBlocks.flatMap(blockImageKeys)),
    ...content.pages.flatMap((page) => page.blocks.flatMap(blockImageKeys)),
  ]
  return new Set(keys.filter((key): key is string => key !== null))
}
