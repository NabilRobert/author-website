/**
 * Replaces the database and uploads with a backup read from standard input
 * (server/node/backup-archive.ts). Run only while the site is stopped;
 * ops/restore.sh decrypts the backup, checks that, and runs this:
 *
 *   age -d -i key.txt backup.tar.age | docker run -i … framed:local node dist-node/restore-cli.mjs
 */
import { restoreArchive } from './backup-archive'
import { DEFAULT_DATABASE_PATH } from './database'
import { DEFAULT_FILES_PATH } from './disk-bucket'
import { readSetting } from './settings'

await restoreArchive(
  {
    databasePath: readSetting('DATABASE_PATH') ?? DEFAULT_DATABASE_PATH,
    filesPath: readSetting('FILES_PATH') ?? DEFAULT_FILES_PATH,
  },
  process.stdin,
)
console.log('Restored the database and uploads from the backup.')
