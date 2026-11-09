// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '../../server/password-hash'

const PASSWORD = 'correct horse battery staple'

describe('password hashing', () => {
  it('accepts the right password and refuses a wrong one', async () => {
    const hash = await hashPassword(PASSWORD)
    expect(await verifyPassword({ hash, password: PASSWORD })).toBe(true)
    expect(await verifyPassword({ hash, password: 'correct horse battery stapler' })).toBe(false)
  })

  it('salts every hash, so the same password never hashes the same twice', async () => {
    expect(await hashPassword(PASSWORD)).not.toBe(await hashPassword(PASSWORD))
  })

  it('checks a hash with the round count stored in it, so the count can be raised later', async () => {
    const [algorithm, , salt, hashed] = (await hashPassword(PASSWORD)).split('$')
    const withOtherRounds = [algorithm, 1000, salt, hashed].join('$')
    expect(await verifyPassword({ hash: withOtherRounds, password: PASSWORD })).toBe(false)
  })

  it('refuses a hash in a format it does not know', async () => {
    expect(await verifyPassword({ hash: 'scrypt$abc', password: PASSWORD })).toBe(false)
  })
})
