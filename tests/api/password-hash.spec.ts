// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '../../server/password-hash'

const PASSWORD = 'correct horse battery staple'
const CAFE_NFC = 'kopi café 1234'.normalize('NFC')
const CAFE_NFD = CAFE_NFC.normalize('NFD')

/** A hash as made before passwords were normalised: of the password exactly as typed. */
async function hashAsTyped(password: string): Promise<string> {
  const rounds = 1000
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: rounds }, key, 256)
  const base64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes))
  return ['pbkdf2-sha256', rounds, base64(salt), base64(new Uint8Array(bits))].join('$')
}

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

  it('treats an accent typed as one character or as two as the same password', async () => {
    expect(await verifyPassword({ hash: await hashPassword(CAFE_NFC), password: CAFE_NFD })).toBe(true)
    expect(await verifyPassword({ hash: await hashPassword(CAFE_NFD), password: CAFE_NFC })).toBe(true)
  })

  it('still accepts a hash made before passwords were normalised, typed the same way', async () => {
    expect(await verifyPassword({ hash: await hashAsTyped(CAFE_NFD), password: CAFE_NFD })).toBe(true)
    expect(await verifyPassword({ hash: await hashAsTyped(CAFE_NFC), password: CAFE_NFC })).toBe(true)
  })
})
