/**
 * Local development only: creates a test account and its page at
 * http://localhost:8788/test, filled with the example content, in the
 * LOCAL database (wrangler's local state, the same one `npm run dev:api`
 * uses). It never touches the deployed database.
 *
 *   npm run db:seed:test
 *
 * Log in as test@framed.local; the code prints in the dev:api terminal.
 * Running it again leaves an existing test page as it is.
 */
import { getPlatformProxy } from 'wrangler'
import type { Env } from '../server/env'
import { createSite, findSiteByName } from '../server/sites'
import { loadContent } from '../server/content-read'
import { saveContent } from '../server/content-write'
import { demoContent } from '../shared/demo-content'

const TEST_NAME = 'test'
const TEST_USER = { id: 'local-test-user', email: 'test@framed.local' }

const { env, dispose } = await getPlatformProxy<Env>({ remoteBindings: false })
try {
  const now = new Date()
  await env.DB.prepare(
    `INSERT OR IGNORE INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
     VALUES (?, 'Test', ?, 1, ?, ?)`,
  )
    .bind(TEST_USER.id, TEST_USER.email, now.toISOString(), now.toISOString())
    .run()
  const site = (await findSiteByName(env.DB, TEST_NAME)) ?? (await createSite(env.DB, TEST_USER.id, TEST_NAME, now))
  if (!site) throw new Error(`Could not create /${TEST_NAME}: is the name taken by another local account?`)
  if (await loadContent(env.DB, site.id)) {
    console.log(`/${TEST_NAME} already has content; left as it is.`)
  } else {
    await saveContent(env.DB, site.id, demoContent, now)
    console.log(`Created http://localhost:8788/${TEST_NAME} (log in as ${TEST_USER.email} to edit it).`)
  }
} finally {
  await dispose()
}
