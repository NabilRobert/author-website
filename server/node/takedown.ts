/**
 * Moderation on the Node version's database, for server/node/takedown-cli.ts:
 * list recent reports, and hide or show a page. A hidden page answers
 * "There is no page at this address" to visitors (server/public-routes.ts);
 * its owner can still log in and edit it.
 */
import type Database from 'better-sqlite3'

const REPORTS_SHOWN = 20

export interface ReportRow {
  reportedAt: string
  siteName: string
  reason: string
  isHidden: boolean
}

export function recentReports(db: Database.Database): ReportRow[] {
  const rows = db
    .prepare(
      `SELECT r.created_at AS reportedAt, s.name AS siteName, r.reason, s.is_hidden AS isHidden
       FROM reports r JOIN sites s ON s.id = r.site_id
       ORDER BY r.created_at DESC LIMIT ?`,
    )
    .all(REPORTS_SHOWN) as (Omit<ReportRow, 'isHidden'> & { isHidden: number })[]
  return rows.map((row) => ({ ...row, isHidden: row.isHidden === 1 }))
}

/** Hides or shows the page; false when no page has that name. */
export function setHidden(db: Database.Database, siteName: string, isHidden: boolean): boolean {
  const result = db.prepare('UPDATE sites SET is_hidden = ? WHERE name = ?').run(isHidden ? 1 : 0, siteName)
  return result.changes === 1
}
