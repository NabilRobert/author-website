/**
 * A real local D1 database for API tests, from Miniflare (the same
 * simulator `wrangler pages dev` uses), with the migrations applied.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Miniflare } from 'miniflare'

const MIGRATIONS_DIR = join(import.meta.dirname, '../../migrations')

export async function createTestDatabase(): Promise<{ db: D1Database; dispose: () => Promise<void> }> {
  const miniflare = new Miniflare({ modules: true, script: 'export default {}', d1Databases: ['DB'] })
  // Miniflare's D1 type is a copy of the Workers one; they match at runtime.
  const db = (await miniflare.getD1Database('DB')) as unknown as D1Database
  for (const file of readdirSync(MIGRATIONS_DIR).sort()) {
    await db.batch(splitStatements(readFileSync(join(MIGRATIONS_DIR, file), 'utf8')).map((sql) => db.prepare(sql)))
  }
  return { db, dispose: () => miniflare.dispose() }
}

/** The migration files' statements, without comments. */
function splitStatements(sql: string): string[] {
  return sql
    .replace(/--.*$/gm, '')
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean)
}
