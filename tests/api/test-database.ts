/**
 * Real local Cloudflare bindings for API tests, from Miniflare (Cloudflare's
 * simulator): a D1 database with the migrations applied, and an R2 bucket.
 *
 * With TEST_DATABASE=sqlite (`npm run test:sqlite`), the database is instead
 * a SQLite file in memory behind the Node version's adapter
 * (server/node/sqlite-d1.ts), so the same tests prove both versions behave alike.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Miniflare } from 'miniflare'
import Database from 'better-sqlite3'
import { asD1 } from '../../server/node/sqlite-d1'
import { applyMigrations } from '../../server/node/migrate'

const MIGRATIONS_DIR = join(import.meta.dirname, '../../migrations')

interface TestBindings {
  db: D1Database
  images: R2Bucket
  // Set in SQLite mode: what Better Auth uses directly (server/env.ts: SQLITE_DATABASE).
  sqlite?: object
  dispose: () => Promise<void>
}

export const isSqliteRun = process.env.TEST_DATABASE === 'sqlite'

export async function createTestDatabase(): Promise<TestBindings> {
  const miniflare = new Miniflare({
    modules: true,
    script: 'export default {}',
    d1Databases: ['DB'],
    r2Buckets: ['IMAGES'],
  })
  // Miniflare's types are copies of the Workers ones; they match at runtime.
  const db = (await miniflare.getD1Database('DB')) as unknown as D1Database
  const images = (await miniflare.getR2Bucket('IMAGES')) as unknown as R2Bucket
  for (const file of readdirSync(MIGRATIONS_DIR).sort()) {
    await db.batch(splitStatements(readFileSync(join(MIGRATIONS_DIR, file), 'utf8')).map((sql) => db.prepare(sql)))
  }
  if (isSqliteRun) {
    const sqlite = new Database(':memory:')
    sqlite.pragma('foreign_keys = ON')
    applyMigrations(sqlite, MIGRATIONS_DIR)
    return { db: asD1(sqlite), images, sqlite, dispose: () => miniflare.dispose() }
  }
  return { db, images, dispose: () => miniflare.dispose() }
}

/** The migration files' statements, without comments. */
function splitStatements(sql: string): string[] {
  return sql
    .replace(/--.*$/gm, '')
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean)
}
