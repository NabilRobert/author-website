// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { REPORT_NOTICES_PER_DAY } from '../../server/reports'
import { createTestApp } from './test-app'
import type { TestApp } from './test-app'

const MODERATOR = 'arthur@example.com'

let api: TestApp
beforeEach(async () => {
  api = await createTestApp()
  api.env.REPORTS_EMAIL = MODERATOR
  await api.signUp('mara@example.com', 'mara')
})
afterEach(async () => {
  await api.dispose()
})

const report = (reason = 'This page copies my work.') => api.postJson('/api/sites/mara/report', { reason })

describe('report notices', () => {
  it('emails Arthur the page and the reason for each new report', async () => {
    expect((await report()).status).toBe(201)
    expect(api.sentReportNotices).toEqual([{ to: MODERATOR, siteName: 'mara', reason: 'This page copies my work.' }])
  })

  it('only stores the report when no moderator address is set', async () => {
    api.env.REPORTS_EMAIL = undefined
    expect((await report()).status).toBe(201)
    expect(api.sentReportNotices).toEqual([])
  })

  it(`stops emailing after ${REPORT_NOTICES_PER_DAY} a day, but still stores every report`, async () => {
    for (let count = 0; count <= REPORT_NOTICES_PER_DAY; count++) expect((await report()).status).toBe(201)
    expect(api.sentReportNotices).toHaveLength(REPORT_NOTICES_PER_DAY)
    const stored = await api.db.prepare('SELECT COUNT(*) AS count FROM reports').first<{ count: number }>()
    expect(stored?.count).toBe(REPORT_NOTICES_PER_DAY + 1)
  })
})
