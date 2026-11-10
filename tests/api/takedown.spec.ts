// @vitest-environment node
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { applyMigrations } from '../../server/node/migrate'
import { recentReports, setHidden } from '../../server/node/takedown'

let db: Database.Database
beforeEach(() => {
  db = new Database(':memory:')
  applyMigrations(db, join(import.meta.dirname, '../../migrations'))
  db.prepare(
    `INSERT INTO "user" (id, name, email, emailVerified, createdAt, updatedAt) VALUES ('u1', '', 'mara@example.com', 1, '2026-01-01', '2026-01-01')`,
  ).run()
  db.prepare(`INSERT INTO sites (id, owner_user_id, name, created_at) VALUES ('s1', 'u1', 'mara', '2026-01-01')`).run()
  db.prepare(
    `INSERT INTO reports (id, site_id, reason, created_at) VALUES ('r1', 's1', 'Copies my work.', '2026-11-10 09:00:00')`,
  ).run()
})

const isHidden = () =>
  (db.prepare("SELECT is_hidden FROM sites WHERE name = 'mara'").get() as { is_hidden: number }).is_hidden

describe('the takedown command (Node version)', () => {
  it('lists recent reports with the page they are about', () => {
    expect(recentReports(db)).toEqual([
      { reportedAt: '2026-11-10 09:00:00', siteName: 'mara', reason: 'Copies my work.', isHidden: false },
    ])
  })

  it('hides a page from visitors, and shows it again', () => {
    expect(setHidden(db, 'mara', true)).toBe(true)
    expect(isHidden()).toBe(1)
    expect(setHidden(db, 'mara', false)).toBe(true)
    expect(isHidden()).toBe(0)
  })

  it('says when no page has that name', () => {
    expect(setHidden(db, 'nobody', true)).toBe(false)
  })
})
