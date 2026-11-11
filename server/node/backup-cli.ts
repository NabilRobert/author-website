/**
 * Writes a backup of everything Framed keeps (the database, copied safely
 * while it runs, and the uploads) to standard output as a tar stream
 * (server/node/backup-archive.ts). ops/backup.sh runs it nightly and pipes
 * it straight into age, so nothing unencrypted is written to the host:
 *
 *   docker exec -i framed-framed-1 node dist-node/backup-cli.mjs | age -r <public key> > backup.tar.age
 */
import { writeArchive } from './backup-archive'
import { DEFAULT_DATABASE_PATH } from './database'
import { DEFAULT_FILES_PATH } from './disk-bucket'
import { readSetting } from './settings'

if (process.stdout.isTTY) {
  throw new Error('The backup is binary: pipe it into age (ops/backup.sh) instead of printing it.')
}
await writeArchive(
  {
    databasePath: readSetting('DATABASE_PATH') ?? DEFAULT_DATABASE_PATH,
    filesPath: readSetting('FILES_PATH') ?? DEFAULT_FILES_PATH,
  },
  process.stdout,
)
