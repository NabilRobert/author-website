/**
 * Makes an invite in the Node version's database and prints the link
 * (the VPS twin of scripts/create-invite.ts):
 *
 *   docker compose exec framed node dist-node/invite-cli.mjs [their@email.com]
 */
import { z } from 'zod'
import { newInviteCode } from '../invites'
import { DEFAULT_DATABASE_PATH, openDatabase } from './database'
import { readSetting, requireSetting } from './settings'

const email = process.argv[2] ?? ''
if (email && !z.email().safeParse(email).success) {
  throw new Error(`"${email}" isn't an email address. Run it again with a correct one, or none.`)
}
const db = openDatabase(readSetting('DATABASE_PATH') ?? DEFAULT_DATABASE_PATH)
const code = newInviteCode()
db.prepare('INSERT INTO invites (code, email, created_at) VALUES (?, ?, ?)').run(
  code,
  email ? email.toLowerCase() : null,
  new Date().toISOString(),
)
console.log(`Invite ${code}${email ? ` for ${email}` : ''}. Send this link:`)
console.log(`${requireSetting('SITE_URL')}/login?invite=${code}`)
