/**
 * Opens the Node version's SQLite file with the settings D1 has (foreign
 * keys enforced) plus write-ahead logging, so readers don't wait for a save.
 */
import Database from 'better-sqlite3'

export const DEFAULT_DATABASE_PATH = '/data/framed.sqlite'

export function openDatabase(path: string): Database.Database {
  const db = new Database(path)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  return db
}
