/**
 * Makes an invite for signing up while Framed is invite-only
 * (server/invites.ts), and prints the link to send.
 *
 *   npm run invite                         an invite anyone can use, in the local database
 *   npm run invite -- sam@example.com      one that only works for that email
 *   npm run invite -- --remote [email]     in the live database (after `npx wrangler login`)
 *
 * Each invite works once.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { z } from 'zod'
import { newInviteCode } from '../server/invites'

const LOCAL_SITE_URL = 'http://localhost:8788'
const args = process.argv.slice(2)
const isRemote = args.includes('--remote')
const email = args.find((arg) => !arg.startsWith('--')) ?? ''

// Checked before it goes into the SQL below; an email address has no quotes.
if (email && !z.email().safeParse(email).success) {
  throw new Error(`"${email}" isn't an email address. Run it again with a correct one, or none.`)
}

const code = newInviteCode()
const emailValue = email ? `'${email.toLowerCase()}'` : 'NULL'
const sql = `INSERT INTO invites (code, email, created_at) VALUES ('${code}', ${emailValue}, '${new Date().toISOString()}')`
execFileSync('npx', ['wrangler', 'd1', 'execute', 'DB', isRemote ? '--remote' : '--local', '--command', sql], {
  stdio: 'inherit',
})

const siteUrl = isRemote ? liveSiteUrl() : LOCAL_SITE_URL
console.log(`\nInvite ${code}${email ? ` for ${email}` : ''}. Send this link:\n${siteUrl}/login?invite=${code}`)

// SITE_URL from wrangler.toml, so the link matches the live site.
function liveSiteUrl(): string {
  const match = /^SITE_URL\s*=\s*"([^"]+)"/m.exec(readFileSync('wrangler.toml', 'utf8'))
  if (!match?.[1]) throw new Error('SITE_URL is missing from wrangler.toml; set it to the live address.')
  return match[1]
}
