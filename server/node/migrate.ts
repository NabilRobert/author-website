/**
 * Applies migrations/*.sql that a SQLite file hasn't had yet, in name
 * order, each in its own transaction. Applied names are kept in
 * `d1_migrations`, the same table wrangler uses on D1, so both versions
 * of Framed track migrations the same way.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type Database from 'better-sqlite3'

/** Applies what is missing and returns the names it applied. */
export function applyMigrations(db: Database.Database, migrationsDir: string): string[] {
  db.exec(`CREATE TABLE IF NOT EXISTS d1_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`)
  const done = new Set(db.prepare('SELECT name FROM d1_migrations').pluck().all() as string[])
  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()
  const applied: string[] = []
  for (const file of files) {
    if (done.has(file)) continue
    const sql = readFileSync(join(migrationsDir, file), 'utf8')
    db.transaction(() => {
      db.exec(sql)
      db.prepare('INSERT INTO d1_migrations (name) VALUES (?)').run(file)
    })()
    applied.push(file)
  }
  return applied
}
