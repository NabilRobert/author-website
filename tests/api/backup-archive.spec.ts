// @vitest-environment node
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PassThrough, Readable } from 'node:stream'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { restoreArchive, writeArchive } from '../../server/node/backup-archive'
import type { DataPaths } from '../../server/node/backup-archive'
import { openDatabase } from '../../server/node/database'
import { applyMigrations } from '../../server/node/migrate'

const MIGRATIONS_DIR = join(import.meta.dirname, '../../migrations')
const hasAge = spawnSync('age', ['--version']).status === 0

let workDir: string
beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'framed-backup-'))
})
afterEach(() => rmSync(workDir, { recursive: true, force: true }))

/** A data folder like the server's: a database with one site, and uploads. */
function makeServerData(name: string, siteName: string): DataPaths {
  const dataDir = join(workDir, name)
  mkdirSync(join(dataDir, 'files/images'), { recursive: true })
  mkdirSync(join(dataDir, 'files/.tmp'))
  const paths = { databasePath: join(dataDir, 'framed.sqlite'), filesPath: join(dataDir, 'files') }
  const db = openDatabase(paths.databasePath)
  applyMigrations(db, MIGRATIONS_DIR)
  db.prepare(
    `INSERT INTO "user" (id, name, email, emailVerified, createdAt, updatedAt) VALUES ('u1', '', 'mara@example.com', 1, '2026-01-01', '2026-01-01')`,
  ).run()
  db.prepare(`INSERT INTO sites (id, owner_user_id, name, created_at) VALUES ('s1', 'u1', ?, '2026-01-01')`).run(
    siteName,
  )
  db.close()
  writeFileSync(join(paths.filesPath, 'images/photo.png'), `picture of ${siteName}`)
  writeFileSync(join(paths.filesPath, '.tmp/unfinished'), 'half an upload')
  return paths
}

async function archiveOf(paths: DataPaths): Promise<Buffer> {
  const output = new PassThrough()
  const chunks: Buffer[] = []
  output.on('data', (chunk: Buffer) => chunks.push(chunk))
  await writeArchive(paths, output)
  return Buffer.concat(chunks)
}

function siteNameIn(paths: DataPaths): string {
  const db = openDatabase(paths.databasePath)
  const row = db.prepare('SELECT name FROM sites').get() as { name: string }
  db.close()
  return row.name
}

describe('backups of the Node version (database and uploads)', () => {
  it('restores the database and uploads it was taken from', async () => {
    const live = makeServerData('live', 'mara')
    const archive = await archiveOf(live)
    const replacement = makeServerData('replacement', 'someone-else')

    await restoreArchive(replacement, Readable.from([archive]))

    expect(siteNameIn(replacement)).toBe('mara')
    expect(readFileSync(join(replacement.filesPath, 'images/photo.png'), 'utf8')).toBe('picture of mara')
  })

  it('leaves out unfinished uploads, and no copy of the database behind', async () => {
    const live = makeServerData('live', 'mara')
    const archive = await archiveOf(live)
    const restored = makeServerData('restored', 'someone-else')
    rmSync(join(restored.filesPath, '.tmp'), { recursive: true })

    await restoreArchive(restored, Readable.from([archive]))

    expect(existsSync(join(restored.filesPath, '.tmp'))).toBe(false)
    expect(readdirSync(join(workDir, 'live')).sort()).toEqual(['files', 'framed.sqlite'])
  })

  it('changes nothing when the backup is damaged', async () => {
    const live = makeServerData('live', 'mara')
    const archive = await archiveOf(makeServerData('other', 'someone-else'))
    const cutOff = archive.subarray(0, 2048)

    await expect(restoreArchive(live, Readable.from([cutOff]))).rejects.toThrow()

    expect(siteNameIn(live)).toBe('mara')
    expect(readFileSync(join(live.filesPath, 'images/photo.png'), 'utf8')).toBe('picture of mara')
  })

  it('changes nothing when the archive is not a Framed backup', async () => {
    const live = makeServerData('live', 'mara')
    const otherFolder = join(workDir, 'not-framed')
    mkdirSync(otherFolder)
    writeFileSync(join(otherFolder, 'notes.txt'), 'something else')
    const otherArchive = execFileSync('tar', ['-cf', '-', '-C', otherFolder, 'notes.txt'])

    await expect(restoreArchive(live, Readable.from([otherArchive]))).rejects.toThrow('is it a Framed backup?')

    expect(siteNameIn(live)).toBe('mara')
    expect(readFileSync(join(live.filesPath, 'images/photo.png'), 'utf8')).toBe('picture of mara')
  })

  it.skipIf(!hasAge)('survives age encryption with a test key, end to end', async () => {
    const keyPath = join(workDir, 'test-key.txt')
    execFileSync('age-keygen', ['-o', keyPath], { stdio: 'ignore' })
    const publicKey = execFileSync('age-keygen', ['-y', keyPath], { encoding: 'utf8' }).trim()
    const live = makeServerData('live', 'mara')

    const encrypted = execFileSync('age', ['-r', publicKey], { input: await archiveOf(live) })
    expect(encrypted.includes(Buffer.from('picture of mara'))).toBe(false)
    const decrypted = execFileSync('age', ['-d', '-i', keyPath], { input: encrypted })
    const restored = makeServerData('restored', 'someone-else')
    await restoreArchive(restored, Readable.from([decrypted]))

    expect(siteNameIn(restored)).toBe('mara')
  })
})
