// Prints the SQL for Better Auth's tables, as configured in server/auth.ts
// (email-code login, rate limits in the database), using a throwaway local
// D1. Run after upgrading better-auth and compare with
// migrations/0001_create_account_tables.sql:
//   node scripts/print-auth-tables.mjs
import { Miniflare } from 'miniflare'
import { getMigrations } from 'better-auth/db/migration'
import { emailOTP } from 'better-auth/plugins'

const miniflare = new Miniflare({ modules: true, script: 'export default {}', d1Databases: ['DB'] })
const { compileMigrations } = await getMigrations({
  database: await miniflare.getD1Database('DB'),
  secret: 'only-used-to-describe-the-tables-xxxx',
  rateLimit: { enabled: true, storage: 'database' },
  plugins: [emailOTP({ async sendVerificationOTP() {} })],
})
console.log(await compileMigrations())
await miniflare.dispose()
