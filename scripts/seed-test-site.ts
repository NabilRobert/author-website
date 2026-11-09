/**
 * Local development only: creates a test account and its page at
 * http://localhost:8788/test, filled with the example content, in the
 * LOCAL database (wrangler's local state, the same one `npm run dev:api`
 * uses). It never touches the deployed database.
 *
 *   npm run db:seed:test
 *
 * Log in as test@framed.local with the password you set as
 * LOCAL_DEV_TEST_PASSWORD in .dev.vars (never committed). The email counts
 * as confirmed already. Running it again leaves an existing test page as it
 * is and sets the account's password to the current value.
 */
import { getPlatformProxy } from 'wrangler'
import type { Env } from '../server/env'
import { createSite, findSiteByName } from '../server/sites'
import { loadContent } from '../server/content-read'
import { saveContent } from '../server/content-write'
import { demoContent } from '../shared/demo-content'
import { TEST_ACCOUNT_EMAIL, TEST_ACCOUNT_SITE } from '../shared/test-account'
import { hashPassword } from '../server/password-hash'
import { MIN_PASSWORD_LENGTH } from '../shared/passwords'

const TEST_NAME = TEST_ACCOUNT_SITE
const TEST_USER = { id: 'local-test-user', email: TEST_ACCOUNT_EMAIL }
// Read from .dev.vars, so no password is in the repository.
type SeedEnv = Env & { LOCAL_DEV_TEST_PASSWORD?: string }

const { env, dispose } = await getPlatformProxy<SeedEnv>({ remoteBindings: false })
try {
  const password = env.LOCAL_DEV_TEST_PASSWORD ?? ''
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `LOCAL_DEV_TEST_PASSWORD is not set: add it to .dev.vars (at least ${MIN_PASSWORD_LENGTH} characters), then run this again.`,
    )
  }
  const now = new Date()
  await env.DB.prepare(
    `INSERT OR IGNORE INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
     VALUES (?, 'Test', ?, 1, ?, ?)`,
  )
    .bind(TEST_USER.id, TEST_USER.email, now.toISOString(), now.toISOString())
    .run()
  // Better Auth keeps a password on a "credential" account row.
  await env.DB.prepare(
    `INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
     VALUES ('local-test-account', ?, 'credential', ?, ?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET password = excluded.password, "updatedAt" = excluded."updatedAt"`,
  )
    .bind(TEST_USER.id, TEST_USER.id, await hashPassword(password), now.toISOString(), now.toISOString())
    .run()
  const site = (await findSiteByName(env.DB, TEST_NAME)) ?? (await createSite(env.DB, TEST_USER.id, TEST_NAME, now))
  if (!site) throw new Error(`Could not create /${TEST_NAME}: is the name taken by another local account?`)
  if (await loadContent(env.DB, site.id)) {
    console.log(`/${TEST_NAME} already has content; left as it is.`)
  } else {
    await saveContent(env.DB, site.id, demoContent, now)
    console.log(`Created http://localhost:8788/${TEST_NAME}.`)
  }
  console.log(`Log in as ${TEST_USER.email} with LOCAL_DEV_TEST_PASSWORD from .dev.vars.`)
} finally {
  await dispose()
}
