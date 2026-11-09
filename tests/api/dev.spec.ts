// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createSite } from '../../server/sites'
import { createTestApp } from './test-app'
import type { TestApp } from './test-app'

let api: TestApp
beforeEach(async () => {
  api = await createTestApp()
  // What `npm run db:seed:test` creates.
  const now = new Date().toISOString()
  await api.db
    .prepare(
      `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") VALUES (?, 'Test', ?, 1, ?, ?)`,
    )
    .bind('local-test-user', 'test@framed.local', now, now)
    .run()
  await createSite(api.db, 'local-test-user', 'test', new Date())
})
afterEach(async () => {
  await api.dispose()
})

const withTestLogin = () => ({ ...api.env, LOCAL_DEV_TEST_LOGIN: 'true' })

describe('GET /api/dev/test-login', () => {
  it('does not exist unless the local setting is on', async () => {
    expect((await api.request('/api/dev/test-login')).status).toBe(404)
  })

  it('does not exist on a real domain, even with the setting on', async () => {
    const response = await api.app.request('https://framed.my.id/api/dev/test-login', {}, withTestLogin())
    expect(response.status).toBe(404)
  })

  it('logs in as the test user on localhost and opens the test editor', async () => {
    const response = await api.app.request('http://localhost:8788/api/dev/test-login', {}, withTestLogin())
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('/test/edit')
    const cookie = response.headers
      .getSetCookie()
      .map((value) => value.split(';')[0])
      .join('; ')
    const me = await api.request('/api/me', {}, cookie)
    expect(await me.json()).toEqual({ email: 'test@framed.local', site: { name: 'test' } })
  })
})
