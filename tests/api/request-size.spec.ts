// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MAX_REQUEST_BYTES } from '../../server/app'
import { createTestApp } from './test-app'
import type { TestApp } from './test-app'

let api: TestApp
beforeEach(async () => {
  api = await createTestApp()
})
afterEach(async () => {
  await api.dispose()
})

const tooBig = (field: string) => ({ [field]: 'a'.repeat(MAX_REQUEST_BYTES + 1) })

describe('the API request size limit', () => {
  it('refuses an oversized report before reading it all', async () => {
    await api.signUp('mara@example.com', 'mara')
    const response = await api.postJson('/api/sites/mara/report', tooBig('reason'))
    expect(response.status).toBe(413)
    expect(await response.json()).toEqual({ error: 'That request is too large.' })
  })

  it('refuses an oversized login', async () => {
    expect((await api.postJson('/api/auth/sign-in/email', tooBig('email'))).status).toBe(413)
  })

  it('refuses an oversized request to the logged-in routes', async () => {
    const cookie = await api.logIn('mara@example.com')
    expect((await api.postJson('/api/me/site', tooBig('name'), cookie)).status).toBe(413)
  })

  it('leaves saving a whole site to its own, larger limit', async () => {
    const cookie = await api.signUp('mara@example.com', 'mara')
    const response = await api.request(
      '/api/me/content',
      { method: 'PUT', body: JSON.stringify(tooBig('note')), headers: { 'Content-Type': 'application/json' } },
      cookie,
    )
    expect(response.status).not.toBe(413)
  })
})
