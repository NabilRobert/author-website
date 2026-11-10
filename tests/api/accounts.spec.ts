// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, PASSWORD } from './test-app'
import type { TestApp } from './test-app'

let api: TestApp
beforeEach(async () => {
  api = await createTestApp()
})
afterEach(async () => {
  await api.dispose()
})

describe('signing up and logging in with a password', () => {
  const email = 'mara@example.com'
  const signUp = (password = PASSWORD) => api.postJson('/api/auth/sign-up/email', { email, password, name: '' })
  const logIn = (password = PASSWORD) => api.postJson('/api/auth/sign-in/email', { email, password })

  it('emails a 6-digit code at sign-up, and the code confirms the email and logs in', async () => {
    const cookie = await api.logIn(email)
    expect(api.codes.get(email)).toMatch(/^\d{6}$/)
    const me = await api.request('/api/me', {}, cookie)
    expect(await me.json()).toEqual({ email, site: null })
  })

  it('logs in with the password once the email is confirmed', async () => {
    await api.logIn(email)
    expect((await logIn()).ok).toBe(true)
  })

  it('refuses to log in before the email is confirmed', async () => {
    await signUp()
    expect((await logIn()).status).toBe(403)
  })

  it('refuses a wrong password', async () => {
    await api.logIn(email)
    expect((await logIn('not the password at all')).status).toBe(401)
  })

  it('refuses a password shorter than 10 characters', async () => {
    expect((await signUp('short-pw')).status).toBe(400)
  })

  it('refuses a password found in a data breach, and says why', async () => {
    api.leakedPasswords.add('password1234')
    const response = await signUp('password1234')
    expect(response.status).toBe(400)
    expect(await response.text()).toContain('appeared in a data breach')
  })

  it('stores the password hashed with PBKDF2, never as typed', async () => {
    await api.logIn(email)
    const row = await api.db.prepare('SELECT password FROM account').first<{ password: string }>()
    expect(row?.password).toMatch(/^pbkdf2-sha256\$100000\$/)
    expect(row?.password).not.toContain(PASSWORD)
  })

  it('stores the emailed code hashed, not as sent', async () => {
    await signUp()
    const row = await api.db.prepare('SELECT value FROM verification').first<{ value: string }>()
    expect(row?.value).not.toContain(api.codes.get(email))
  })

  it('no longer logs in with a code instead of the password', async () => {
    const response = await api.postJson('/api/auth/sign-in/email-otp', { email, otp: '123456' })
    expect(response.status).toBe(404)
  })

  it('answers /api/me with 401 when nobody is logged in', async () => {
    expect((await api.request('/api/me')).status).toBe(401)
  })
})

describe('resetting a forgotten password', () => {
  const email = 'mara@example.com'
  const NEW_PASSWORD = 'a brand new passphrase'

  async function resetPassword(otp: string | undefined) {
    return api.postJson('/api/auth/email-otp/reset-password', { email, otp, password: NEW_PASSWORD })
  }

  it('emails a code that sets a new password, and logs out everywhere', async () => {
    const oldCookie = await api.logIn(email)
    await api.postJson('/api/auth/email-otp/request-password-reset', { email })
    expect((await resetPassword(api.codes.get(email))).ok).toBe(true)
    expect((await api.postJson('/api/auth/sign-in/email', { email, password: PASSWORD })).status).toBe(401)
    expect((await api.postJson('/api/auth/sign-in/email', { email, password: NEW_PASSWORD })).ok).toBe(true)
    expect((await api.request('/api/me', {}, oldCookie)).status).toBe(401)
  })

  it('refuses a wrong code', async () => {
    await api.logIn(email)
    await api.postJson('/api/auth/email-otp/request-password-reset', { email })
    expect((await resetPassword('000000')).ok).toBe(false)
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
    ['support', 'That name is used by Framed itself. Pick another.'],
    ['administrator', 'That name is used by Framed itself. Pick another.'],
    ['framed-security', 'That name is used by Framed itself. Pick another.'],
    ['ab', 'Use at least 3 characters.'],
    ['no spaces', 'Use letters, numbers and dashes, like "mara-ellison".'],
  ])('refuses the name "%s"', async (name, message) => {
    const cookie = await api.logIn('mara@example.com')
    const response = await api.postJson('/api/me/site', { name }, cookie)
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: message })
  })

  it('allows names that only contain "framed" inside a word', async () => {
    const cookie = await api.logIn('mara@example.com')
    expect((await api.postJson('/api/me/site', { name: 'reframed-studio' }, cookie)).status).toBe(201)
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
