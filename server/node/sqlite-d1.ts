/**
 * A SQLite file (better-sqlite3) behind the small part of Cloudflare D1's
 * API that Framed uses: prepare → bind → first / all / run, and batch. It
 * lets the same server code run on a VPS (server/node/main.ts) as on
 * Cloudflare. Like D1, a batch is one transaction: all of it or none.
 *
 * better-sqlite3 is synchronous; the methods return promises only to match
 * D1, so callers stay the same.
 */
import type Database from 'better-sqlite3'

type Value = string | number | null | bigint | Buffer

interface RunMeta {
  changes: number
  last_row_id: number
}

export class SqliteStatement {
  constructor(
    private readonly db: Database.Database,
    private readonly sql: string,
    private readonly values: Value[] = [],
  ) {}

  bind(...values: Value[]): SqliteStatement {
    return new SqliteStatement(this.db, this.sql, values)
  }

  async first<Row>(): Promise<Row | null> {
    return this.firstNow<Row>()
  }

  async all<Row>(): Promise<{ results: Row[]; success: true; meta: RunMeta }> {
    return this.allNow<Row>()
  }

  async run(): Promise<{ results: []; success: true; meta: RunMeta }> {
    return { ...this.runNow(), results: [] }
  }

  /** Runs it now: reads give their rows, writes their counts (used by batch). */
  execute(): { results: unknown[]; success: true; meta: RunMeta } {
    return this.statement().reader ? this.allNow() : { ...this.runNow(), results: [] }
  }

  private statement() {
    return this.db.prepare(this.sql)
  }

  private firstNow<Row>(): Row | null {
    return (this.statement().get(...this.values) as Row | undefined) ?? null
  }

  private allNow<Row>(): { results: Row[]; success: true; meta: RunMeta } {
    return {
      results: this.statement().all(...this.values) as Row[],
      success: true,
      meta: { changes: 0, last_row_id: 0 },
    }
  }

  private runNow(): { success: true; meta: RunMeta } {
    const result = this.statement().run(...this.values)
    return { success: true, meta: { changes: result.changes, last_row_id: Number(result.lastInsertRowid) } }
  }
}

export class SqliteD1 {
  constructor(private readonly db: Database.Database) {}

  prepare(sql: string): SqliteStatement {
    return new SqliteStatement(this.db, sql)
  }

  /** Every statement in one transaction, as D1 does; one failing undoes them all. */
  async batch<Row = unknown>(statements: SqliteStatement[]) {
    const runAll = this.db.transaction(() => statements.map((statement) => statement.execute()))
    return runAll() as { results: Row[]; success: true; meta: RunMeta }[]
  }
}

/** The adapter, typed as the D1Database the server code expects. */
export function asD1(db: Database.Database): D1Database {
  return new SqliteD1(db) as unknown as D1Database
}
