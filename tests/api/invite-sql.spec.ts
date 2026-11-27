// @vitest-environment node
import { describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { z } from 'zod'
import { insertInviteSql } from '../../scripts/invite-sql'

/** Runs the script's SQL on a real SQLite table and reads back the stored email. */
function storedEmail(email: string | null): unknown {
  const db = new Database(':memory:')
  db.exec('CREATE TABLE invites (code TEXT PRIMARY KEY, email TEXT, created_at TEXT, used_at TEXT)')
  db.exec(insertInviteSql('ABCD2345', email, '2026-11-21T00:00:00.000Z'))
  return (db.prepare('SELECT email FROM invites').get() as { email: unknown }).email
}

describe('the invite script for Cloudflare (scripts/create-invite.ts)', () => {
  it.each(["o'brien@example.com", "x'-'y@example.com"])(
    'stores an email with quotes in it exactly as given: %s',
    (email) => {
      expect(z.email().safeParse(email).success).toBe(true)
      expect(storedEmail(email)).toBe(email)
    },
  )

  it('stores no email for an invite anyone can use', () => {
    expect(storedEmail(null)).toBeNull()
  })
})
