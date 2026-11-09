// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { dayKey, KEEP_DAYS } from '../../server/visits'
import { findSiteByName } from '../../server/sites'
import { createTestApp } from './test-app'
import type { TestApp } from './test-app'

let api: TestApp
let cookie: string
beforeEach(async () => {
  api = await createTestApp()
  cookie = await api.signUp('mara@example.com', 'mara')
})
afterEach(async () => {
  await api.dispose()
})

// As a page sends it: plain text, so the browser needs no permission first.
function countVisit(path: string, site = 'mara') {
  const init = { method: 'POST', body: JSON.stringify({ path }), headers: { 'Content-Type': 'text/plain' } }
  return api.request(`/api/sites/${site}/visits`, init)
}

async function stats() {
  const response = await api.request('/api/me/visits', {}, cookie)
  return (await response.json()) as { days: { day: string; count: number }[]; pages: { path: string; count: number }[] }
}

describe('counting visits', () => {
  it('counts each view by page and day, and shows the owner the last 30 days', async () => {
    for (const path of ['/', '/', '/about', '/work/lantern']) expect((await countVisit(path)).status).toBe(204)
    const { days, pages } = await stats()
    expect(days).toHaveLength(30)
    expect(days.at(-1)).toEqual({ day: dayKey(Date.now()), count: 4 })
    expect(days[0]!.count).toBe(0)
    expect(pages).toEqual([
      { path: '/', count: 2 },
      { path: '/about', count: 1 },
      { path: '/work/lantern', count: 1 },
    ])
  })

  it('keeps nothing about the visitor, only the count', async () => {
    await countVisit('/about')
    const row = await api.db.prepare('SELECT * FROM visits').first<Record<string, unknown>>()
    expect(Object.keys(row!).sort()).toEqual(['count', 'day', 'path', 'site_id'])
  })

  it(`forgets days older than ${KEEP_DAYS}`, async () => {
    const site = await findSiteByName(api.db, 'mara')
    const old = dayKey(Date.now(), KEEP_DAYS + 1)
    await api.db.prepare("INSERT INTO visits VALUES (?, ?, '/', 5)").bind(site!.id, old).run()
    await countVisit('/')
    const left = await api.db.prepare('SELECT day FROM visits').all<{ day: string }>()
    expect(left.results.map((row) => row.day)).toEqual([dayKey(Date.now())])
  })

  it('refuses an address that is not a page address', async () => {
    expect((await countVisit('/../edit?x=1')).status).toBe(400)
    expect((await countVisit('/a/b/c')).status).toBe(400)
  })

  it('answers 404 for a site that does not exist', async () => {
    expect((await countVisit('/', 'nobody-here')).status).toBe(404)
  })

  it('shows the numbers only to the logged-in owner', async () => {
    expect((await api.request('/api/me/visits')).status).toBe(401)
  })
})
