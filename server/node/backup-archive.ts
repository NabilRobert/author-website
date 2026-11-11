/**
 * Everything Framed keeps on a VPS as one tar stream, and back again: a
 * consistent copy of the SQLite database plus the uploads folder. Used by
 * the nightly backup (ops/backup.sh pipes it straight into age, so no
 * unencrypted copy reaches the host's disk) and by ops/restore.sh.
 *
 * The archive holds `.backup-snapshot.sqlite` (SQLite's online backup, safe
 * while the site runs) and the uploads folder under its own name (`files`).
 * The system's `tar` streams it, so it never sits whole in memory.
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, renameSync, rmSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import type { Readable, Writable } from 'node:stream'
import Database from 'better-sqlite3'
import { openDatabase } from './database'

const SNAPSHOT_NAME = '.backup-snapshot.sqlite'
const INCOMING_FOLDER = '.restore-incoming'

export interface DataPaths {
  databasePath: string
  filesPath: string
}

/** Writes the archive to `output`; the snapshot is deleted afterwards, even on failure. */
export async function writeArchive(paths: DataPaths, output: Writable): Promise<void> {
  const dataDir = dirname(paths.databasePath)
  const snapshotPath = join(dataDir, SNAPSHOT_NAME)
  try {
    const db = openDatabase(paths.databasePath)
    await db.backup(snapshotPath)
    db.close()
    mkdirSync(paths.filesPath, { recursive: true })
    const filesParent = dirname(paths.filesPath)
    // `.tmp` holds unfinished uploads (server/node/disk-bucket.ts), never needed again.
    const args = [
      '-cf',
      '-',
      '--exclude=.tmp',
      '-C',
      dataDir,
      SNAPSHOT_NAME,
      '-C',
      filesParent,
      basename(paths.filesPath),
    ]
    await runTar(args, { output })
  } finally {
    rmSync(snapshotPath, { force: true })
  }
}

/**
 * Replaces the database and uploads with the archive read from `input`.
 * Run it only while the site is stopped (ops/restore.sh checks). Nothing
 * is replaced unless the whole archive unpacked and its database opens.
 */
export async function restoreArchive(paths: DataPaths, input: Readable): Promise<void> {
  const incoming = join(dirname(paths.databasePath), INCOMING_FOLDER)
  rmSync(incoming, { recursive: true, force: true })
  mkdirSync(incoming)
  try {
    await runTar(['-xf', '-', '-C', incoming], { input })
    const snapshotPath = join(incoming, SNAPSHOT_NAME)
    const incomingFiles = join(incoming, basename(paths.filesPath))
    checkDatabase(snapshotPath)
    if (!existsSync(incomingFiles)) throw new Error('The backup has no uploads folder: is it a Framed backup?')
    for (const suffix of ['-wal', '-shm']) rmSync(paths.databasePath + suffix, { force: true })
    renameSync(snapshotPath, paths.databasePath)
    rmSync(paths.filesPath, { recursive: true, force: true })
    renameSync(incomingFiles, paths.filesPath)
  } finally {
    rmSync(incoming, { recursive: true, force: true })
  }
}

function checkDatabase(path: string): void {
  if (!existsSync(path)) throw new Error('The backup has no database in it: is it a Framed backup?')
  const db = new Database(path, { readonly: true, fileMustExist: true })
  try {
    const result = db.pragma('integrity_check', { simple: true })
    if (result !== 'ok') throw new Error(`The backup's database is damaged (${String(result)}); try an older backup.`)
  } finally {
    db.close()
  }
}

function runTar(args: string[], streams: { input?: Readable; output?: Writable }): Promise<void> {
  return new Promise((resolve, reject) => {
    const tar = spawn('tar', args, { stdio: ['pipe', 'pipe', 'inherit'] })
    if (streams.input) streams.input.pipe(tar.stdin)
    else tar.stdin.end()
    if (streams.output) tar.stdout.pipe(streams.output, { end: false })
    else tar.stdout.resume()
    tar.on('error', reject)
    tar.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`tar stopped with exit code ${code}.`))))
  })
}
