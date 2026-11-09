/**
 * Sites: who owns which address (framed.my.id/<name>). One site per person
 * for now.
 */
export interface Site {
  id: string
  name: string
  ownerUserId: string
  isHidden: boolean
}

interface SiteRow {
  id: string
  name: string
  owner_user_id: string
  is_hidden: number
}

function toSite(row: SiteRow | null): Site | null {
  if (!row) return null
  return { id: row.id, name: row.name, ownerUserId: row.owner_user_id, isHidden: row.is_hidden === 1 }
}

export async function findSiteByName(db: D1Database, name: string): Promise<Site | null> {
  return toSite(await db.prepare('SELECT * FROM sites WHERE name = ?').bind(name).first<SiteRow>())
}

export async function findSiteByOwner(db: D1Database, userId: string): Promise<Site | null> {
  return toSite(await db.prepare('SELECT * FROM sites WHERE owner_user_id = ?').bind(userId).first<SiteRow>())
}

/** Claims `name` for the user. Returns null if the name is taken. */
export async function createSite(db: D1Database, userId: string, name: string, now: Date): Promise<Site | null> {
  const id = crypto.randomUUID()
  const result = await db
    .prepare('INSERT INTO sites (id, owner_user_id, name, created_at) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING')
    .bind(id, userId, name, now.toISOString())
    .run()
  if (result.meta.changes === 0) return null
  return { id, name, ownerUserId: userId, isHidden: false }
}
