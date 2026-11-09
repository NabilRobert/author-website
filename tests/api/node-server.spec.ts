// @vitest-environment node
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { asD1 } from '../../server/node/sqlite-d1'
import { applyMigrations } from '../../server/node/migrate'
import { readSetting } from '../../server/node/settings'
import { createNodeServer, parseHeadersFile } from '../../server/node/server'
import { saveContent } from '../../server/content-write'
import { findSiteByName } from '../../server/sites'
import { demoContent } from '../../shared/demo-content'
import { createTestApp } from './test-app'
import type { TestApp } from './test-app'

const MIGRATIONS_DIR = join(import.meta.dirname, '../../migrations')

describe('the SQLite adapter (D1 calls on a SQLite file)', () => {
  const db = () => {
    const sqlite = new Database(':memory:')
    sqlite.exec('CREATE TABLE notes (id INTEGER PRIMARY KEY, text TEXT NOT NULL UNIQUE)')
    return asD1(sqlite)
  }

  it('reads one row, all rows, or none, and counts changes', async () => {
    const d1 = db()
    const run = await d1.prepare('INSERT INTO notes (text) VALUES (?), (?)').bind('a', 'b').run()
    expect(run.meta.changes).toBe(2)
    expect(await d1.prepare('SELECT text FROM notes WHERE text = ?').bind('a').first()).toEqual({ text: 'a' })
    expect(await d1.prepare('SELECT text FROM notes WHERE text = ?').bind('z').first()).toBeNull()
    expect((await d1.prepare('SELECT text FROM notes ORDER BY text').all()).results).toEqual([
      { text: 'a' },
      { text: 'b' },
    ])
  })

  it('runs a batch as one transaction: a failing statement undoes the rest', async () => {
    const d1 = db()
    const insert = (text: string) => d1.prepare('INSERT INTO notes (text) VALUES (?)').bind(text)
    await expect(d1.batch([insert('a'), insert('b'), insert('a')])).rejects.toThrow()
    expect((await d1.prepare('SELECT COUNT(*) AS count FROM notes').first<{ count: number }>())?.count).toBe(0)
  })
})

describe('migrations on a SQLite file', () => {
  it('applies every migration once, and nothing the second time', () => {
    const sqlite = new Database(':memory:')
    const first = applyMigrations(sqlite, MIGRATIONS_DIR)
    expect(first[0]).toBe('0001_create_account_tables.sql')
    expect(first.length).toBeGreaterThanOrEqual(9)
    expect(applyMigrations(sqlite, MIGRATIONS_DIR)).toEqual([])
  })
})

describe('settings for the Node version', () => {
  it('takes an environment variable first, then a Docker secret file named after it', () => {
    const secrets = mkdtempSync(join(tmpdir(), 'framed-secrets-'))
    writeFileSync(join(secrets, 'better_auth_secret'), 'from-a-file\n')
    expect(readSetting('BETTER_AUTH_SECRET', {}, secrets)).toBe('from-a-file')
    expect(readSetting('BETTER_AUTH_SECRET', { BETTER_AUTH_SECRET: 'from-env' }, secrets)).toBe('from-env')
    expect(readSetting('RESEND_API_KEY', {}, secrets)).toBeUndefined()
  })
})

describe('the Node server', () => {
  let api: TestApp
  let distDir: string

  beforeEach(async () => {
    api = await createTestApp()
    distDir = mkdtempSync(join(tmpdir(), 'framed-dist-'))
    mkdirSync(join(distDir, 'assets'))
    writeFileSync(join(distDir, 'index.html'), '<html><head><title>Framed</title></head><body></body></html>')
    writeFileSync(join(distDir, 'assets', 'app-1234.js'), 'console.log(1)')
    writeFileSync(
      join(distDir, '_headers'),
      '# comment\n/*\n  X-Frame-Options: DENY\n  X-Content-Type-Options: nosniff\n',
    )
  })
  afterEach(async () => {
    await api.dispose()
  })

  const get = (path: string) => createNodeServer(distDir).fetch(new Request(`http://localhost${path}`), api.env)

  it('reads the security headers for every address from _headers', () => {
    expect(parseHeadersFile('/*\n  X-Frame-Options: DENY\n/admin\n  X-Other: no\n')).toEqual([
      ['X-Frame-Options', 'DENY'],
    ])
  })

  it('answers the API, with the security headers', async () => {
    const response = await get('/api/sign-up')
    expect(await response.json()).toEqual({ isInviteOnly: false })
    expect(response.headers.get('X-Frame-Options')).toBe('DENY')
  })

  it('serves built files, cached for a year', async () => {
    const response = await get('/assets/app-1234.js')
    expect(await response.text()).toBe('console.log(1)')
    expect(response.headers.get('Cache-Control')).toContain('immutable')
  })

  it("answers a site's pages with the app, its link preview added", async () => {
    await api.signUp('mara@example.com', 'mara')
    const site = await findSiteByName(api.db, 'mara')
    await saveContent(api.db, site!.id, demoContent, new Date())
    const html = await (await get('/mara/about')).text()
    expect(html).toContain('<title>About · Alex Rowan</title>')
    expect(html).toContain('og:title')
  })

  it('answers other addresses with the app, unchanged and not cached', async () => {
    const response = await get('/login')
    expect(await response.text()).toContain('<title>Framed</title>')
    expect(response.headers.get('Cache-Control')).toBe('no-cache')
  })
})
