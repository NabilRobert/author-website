/**
 * The SQL that scripts/create-invite.ts hands to `wrangler d1 execute`.
 * That command takes one SQL string and has no way to bind parameters, so
 * values are written as SQLite string literals here, with any quote inside
 * doubled. Email addresses can contain quotes (`o'brien@example.com` is
 * valid), so they can't simply be pasted between quotes.
 */

/** A value as an SQLite string literal: wrapped in quotes, inner quotes doubled. */
export function sqlText(value: string): string {
  return `'${value.replaceAll("'", "''")}'`
}

export function insertInviteSql(code: string, email: string | null, createdAt: string): string {
  const emailValue = email === null ? 'NULL' : sqlText(email)
  return `INSERT INTO invites (code, email, created_at) VALUES (${sqlText(code)}, ${emailValue}, ${sqlText(createdAt)})`
}
