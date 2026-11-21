// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { PASSWORD_TOO_SHORT } from '../../shared/passwords'
import { createTestApp, PASSWORD } from './test-app'
import type { TestApp } from './test-app'

const EMAIL = 'mara@example.com'
// 10 UTF-16 units, so Better Auth's own minimum lets it through, but 5 characters to a person.
const FIVE_EMOJI = '🔥🔥🔥🔥🔥'
// The same password typed two ways: é as one character (NFC), and as e plus an accent (NFD).
const ACCENTED_NFC = 'kopi café di pagi hari'.normalize('NFC')
const ACCENTED_NFD = ACCENTED_NFC.normalize('NFD')

let api: TestApp
beforeEach(async () => {
  api = await createTestApp()
})
afterEach(async () => {
  await api.dispose()
})

async function expectTooShort(response: Response) {
  expect(response.status).toBe(400)
  expect(await response.json()).toMatchObject({ code: 'PASSWORD_TOO_SHORT', message: PASSWORD_TOO_SHORT })
}

describe('choosing a password', () => {
  it('refuses 5 emoji at sign-up: they are 5 characters, not 10', async () => {
    await expectTooShort(
      await api.postJson('/api/auth/sign-up/email', { email: EMAIL, password: FIVE_EMOJI, name: '' }),
    )
  })

  it('refuses 5 emoji as a new password after a reset code', async () => {
    await api.logIn(EMAIL)
    await api.postJson('/api/auth/email-otp/request-password-reset', { email: EMAIL })
    const reset = { email: EMAIL, otp: api.codes.get(EMAIL), password: FIVE_EMOJI }
    await expectTooShort(await api.postJson('/api/auth/email-otp/reset-password', reset))
  })

  it('refuses 5 emoji when changing the password while logged in', async () => {
    const cookie = await api.logIn(EMAIL)
    const change = { currentPassword: PASSWORD, newPassword: FIVE_EMOJI }
    await expectTooShort(await api.postJson('/api/auth/change-password', change, cookie))
  })

  it('accepts 10 emoji', async () => {
    const response = await api.postJson('/api/auth/sign-up/email', {
      email: EMAIL,
      password: FIVE_EMOJI.repeat(2),
      name: '',
    })
    expect(response.ok).toBe(true)
  })

  it('leaves logging in alone: a short password just fails as a wrong one', async () => {
    await api.logIn(EMAIL)
    const response = await api.postJson('/api/auth/sign-in/email', { email: EMAIL, password: FIVE_EMOJI })
    expect(response.status).toBe(401)
  })
})

describe('accented passwords', () => {
  it('logs in whichever way the accent was typed', async () => {
    await api.postJson('/api/auth/sign-up/email', { email: EMAIL, password: ACCENTED_NFD, name: '' })
    await api.postJson('/api/auth/email-otp/verify-email', { email: EMAIL, otp: api.codes.get(EMAIL) })
    const signIn = (password: string) => api.postJson('/api/auth/sign-in/email', { email: EMAIL, password })
    expect((await signIn(ACCENTED_NFC)).ok).toBe(true)
    expect((await signIn(ACCENTED_NFD)).ok).toBe(true)
  })
})
