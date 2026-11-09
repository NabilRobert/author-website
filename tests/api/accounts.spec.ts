// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from './test-app'
import type { TestApp } from './test-app'

let api: TestApp
beforeEach(async () => {
  api = await createTestApp()
})
afterEach(async () => {
  await api.dispose()
})

describe('logging in with an emailed code', () => {
  it('sends a 6-digit code and logs in with it', async () => {
    const cookie = await api.logIn('mara@example.com')
    expect(api.codes.get('mara@example.com')).toMatch(/^\d{6}$/)
    const me = await api.request('/api/me', {}, cookie)
    expect(await me.json()).toEqual({ email: 'mara@example.com', site: null })
  })

  it('refuses a wrong code', async () => {
    await api.postJson('/api/auth/email-otp/send-verification-otp', { email: 'mara@example.com', type: 'sign-in' })
    const response = await api.postJson('/api/auth/sign-in/email-otp', { email: 'mara@example.com', otp: '000000' })
    expect(response.ok).toBe(false)
  })

  it('stores the code hashed, not as typed', async () => {
    await api.postJson('/api/auth/email-otp/send-verification-otp', { email: 'mara@example.com', type: 'sign-in' })
    const row = await api.db.prepare('SELECT value FROM verification').first<{ value: string }>()
    expect(row?.value).not.toContain(api.codes.get('mara@example.com'))
  })

  it('answers /api/me with 401 when nobody is logged in', async () => {
    expect((await api.request('/api/me')).status).toBe(401)
  })
})

describe('claiming a name', () => {
  it('gives the person framed.my.id/<name>', async () => {
    const cookie = await api.signUp('mara@example.com', 'mara-ellison')
    const me = await api.request('/api/me', {}, cookie)
    expect(await me.json()).toEqual({ email: 'mara@example.com', site: { name: 'mara-ellison' } })
  })

  it('refuses a name someone else has', async () => {
    await api.signUp('mara@example.com', 'mara')
    const cookie = await api.logIn('other@example.com')
    const response = await api.postJson('/api/me/site', { name: 'mara' }, cookie)
    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({ error: 'That name is taken. Try another.' })
  })

  it.each([
    ['edit', 'That name is used by Framed itself. Pick another.'],
    ['ab', 'Use at least 3 characters.'],
    ['no spaces', 'Use letters, numbers and dashes, like "mara-ellison".'],
  ])('refuses the name "%s"', async (name, message) => {
    const cookie = await api.logIn('mara@example.com')
    const response = await api.postJson('/api/me/site', { name }, cookie)
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: message })
  })

  it('allows one site per person', async () => {
    const cookie = await api.signUp('mara@example.com', 'mara')
    const response = await api.postJson('/api/me/site', { name: 'mara-two' }, cookie)
    expect(response.status).toBe(409)
  })

  // A cross-site JSON request is stopped by the browser before it is sent
  // (it needs CORS approval, which the API never gives). What a hostile page
  // can send directly is a form or text/plain body; hono's csrf() refuses it.
  it('refuses a text/plain write from another website, even with the login cookie', async () => {
    const cookie = await api.logIn('mara@example.com')
    const init = {
      method: 'POST',
      body: JSON.stringify({ name: 'mara' }),
      headers: { 'Content-Type': 'text/plain', Origin: 'https://evil.example' },
    }
    const response = await api.request('/api/me/site', init, cookie)
    expect(response.status).toBe(403)
  })
})

describe('deleting an account', () => {
  it('removes the person, their site and their logins', async () => {
    const cookie = await api.signUp('mara@example.com', 'mara')
    const response = await api.request('/api/me', { method: 'DELETE' }, cookie)
    expect(response.status).toBe(200)
    for (const table of ['"user"', 'sites', 'session']) {
      const row = await api.db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).first<{ count: number }>()
      expect(row?.count).toBe(0)
    }
    expect((await api.request('/api/me', {}, cookie)).status).toBe(401)
  })
})
