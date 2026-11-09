/**
 * A consistent copy of the Node version's database, safe to take while it
 * runs (SQLite's online backup), for the server's encrypted backups:
 *
 *   docker compose exec framed node dist-node/backup-cli.mjs /data/backups/framed.sqlite
 */
import { DEFAULT_DATABASE_PATH, openDatabase } from './database'
import { readSetting } from './settings'

const target = process.argv[2]
if (!target) throw new Error('Say where to write the copy, like /data/backups/framed.sqlite.')
const db = openDatabase(readSetting('DATABASE_PATH') ?? DEFAULT_DATABASE_PATH)
await db.backup(target)
console.log(`Backed up to ${target}.`)
