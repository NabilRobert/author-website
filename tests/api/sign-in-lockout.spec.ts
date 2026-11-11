// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { WRONG_PASSWORDS_BEFORE_LOCK } from '../../server/sign-in-lockout'
import { createTestApp, PASSWORD } from './test-app'
import type { TestApp } from './test-app'

const EMAIL = 'mara@example.com'

let api: TestApp
let attempt = 0
beforeEach(async () => {
  api = await createTestApp()
  await api.logIn(EMAIL)
  // logIn tries the password once before the account exists; start clean.
  await api.db.prepare('DELETE FROM sign_in_failures').run()
})
afterEach(async () => {
  await api.dispose()
})

// Each try comes from a new address, as from someone with many, so the
// per-address rate limit never steps in and only the lockout is tested.
function signIn(password: string) {
  attempt++
  return api.request('/api/auth/sign-in/email', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, password }),
    headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': `198.51.${attempt >> 8}.${attempt & 255}` },
  })
}

async function guessWrong(times: number) {
  for (let count = 0; count < times; count++) expect((await signIn(`wrong-guess-${count}`)).status).toBe(401)
}

describe('the per-account sign-in lockout', () => {
  it(`locks an account after ${WRONG_PASSWORDS_BEFORE_LOCK} wrong passwords, even from many addresses`, async () => {
    await guessWrong(WRONG_PASSWORDS_BEFORE_LOCK)
    const locked = await signIn(PASSWORD)
    expect(locked.status).toBe(429)
    expect(((await locked.json()) as { message: string }).message).toContain('Forgot your password?')
  })

  it('forgets earlier wrong passwords after a correct one', async () => {
    await guessWrong(WRONG_PASSWORDS_BEFORE_LOCK - 1)
    expect((await signIn(PASSWORD)).ok).toBe(true)
    await guessWrong(WRONG_PASSWORDS_BEFORE_LOCK - 1)
    expect((await signIn(PASSWORD)).ok).toBe(true)
  })

  it('unlocks the account when its password is reset', async () => {
    await guessWrong(WRONG_PASSWORDS_BEFORE_LOCK)
    await api.postJson('/api/auth/email-otp/request-password-reset', { email: EMAIL })
    const newPassword = 'a brand new passphrase'
    const reset = await api.postJson('/api/auth/email-otp/reset-password', {
      email: EMAIL,
      otp: api.codes.get(EMAIL),
      password: newPassword,
    })
    expect(reset.ok).toBe(true)
    expect((await signIn(newPassword)).ok).toBe(true)
  })
})
