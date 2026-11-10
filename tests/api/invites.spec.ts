// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { INVITE_HEADER, newInviteCode, normaliseInviteCode } from '../../server/invites'
import { createTestApp, PASSWORD } from './test-app'
import type { TestApp } from './test-app'

let api: TestApp
beforeEach(async () => {
  api = await createTestApp()
  api.env.SIGN_UP_MODE = 'invite'
})
afterEach(async () => {
  await api.dispose()
})

async function makeInvite(email: string | null = null) {
  const code = newInviteCode()
  await api.db
    .prepare('INSERT INTO invites (code, email, created_at) VALUES (?, ?, ?)')
    .bind(code, email, new Date().toISOString())
    .run()
  return code
}

function signUp(email: string, invite?: string, password = PASSWORD) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (invite !== undefined) headers[INVITE_HEADER] = invite
  return api.request('/api/auth/sign-up/email', {
    method: 'POST',
    body: JSON.stringify({ email, password, name: '' }),
    headers,
  })
}

describe('invite-only sign-up', () => {
  it('says that sign-up needs an invite', async () => {
    expect(await (await api.request('/api/sign-up')).json()).toEqual({ isInviteOnly: true })
  })

  it('refuses to sign up without an invite, saying why', async () => {
    const response = await signUp('sam@example.com')
    expect(response.status).toBe(403)
    expect(((await response.json()) as { message: string }).message).toContain('invite-only')
  })

  it('signs up with an invite, however it is typed, and uses it up', async () => {
    const code = await makeInvite()
    const typed = `${code.slice(0, 4).toLowerCase()}-${code.slice(4)}`
    expect((await signUp('sam@example.com', typed)).ok).toBe(true)
    const second = await signUp('alex@example.com', code)
    expect(second.status).toBe(403)
    expect(((await second.json()) as { message: string }).message).toContain('has been used')
  })

  it('keeps the invite when the sign-up itself fails', async () => {
    const code = await makeInvite()
    expect((await signUp('sam@example.com', code, 'short')).ok).toBe(false)
    expect((await signUp('sam@example.com', code)).ok).toBe(true)
  })

  it('gives one account when several sign-ups race on one invite', async () => {
    const code = await makeInvite()
    const emails = ['a@example.com', 'b@example.com', 'c@example.com', 'd@example.com']
    const responses = await Promise.all(emails.map((email) => signUp(email, code)))
    expect(responses.filter((response) => response.ok)).toHaveLength(1)
    const accounts = await api.db.prepare('SELECT COUNT(*) AS count FROM "user"').first<{ count: number }>()
    expect(accounts?.count).toBe(1)
  })

  it('refuses an invite made for someone else', async () => {
    const code = await makeInvite('sam@example.com')
    const response = await signUp('alex@example.com', code)
    expect(response.status).toBe(403)
    expect(((await response.json()) as { message: string }).message).toContain('different email address')
    expect((await signUp('SAM@example.com', code)).ok).toBe(true)
  })

  it('refuses a code that was never made', async () => {
    expect((await signUp('sam@example.com', 'ABCDEFGH')).status).toBe(403)
  })

  it('lets anyone sign up when sign-up is open', async () => {
    api.env.SIGN_UP_MODE = 'open'
    expect((await signUp('sam@example.com')).ok).toBe(true)
    expect(await (await api.request('/api/sign-up')).json()).toEqual({ isInviteOnly: false })
  })

  it('is invite-only when the setting is missing, so a forgotten setting never opens it', async () => {
    delete api.env.SIGN_UP_MODE
    expect((await signUp('sam@example.com')).status).toBe(403)
  })
})

describe('invite codes', () => {
  it('are 8 letters and digits that are hard to misread', () => {
    expect(newInviteCode()).toMatch(/^[2-9A-HJ-KMNP-Z]{8}$/)
  })

  it('match however people type them', () => {
    expect(normaliseInviteCode(' k7q2-m9xw ')).toBe('K7Q2M9XW')
  })
})
