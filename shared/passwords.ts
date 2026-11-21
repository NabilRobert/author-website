/**
 * Password rules shared by the login page (checked before sending) and
 * Better Auth (server/auth.ts, checked again).
 *
 * NIST SP 800-63B asks for at least 8 characters; 10 leaves room for the
 * weaker hashing Cloudflare's free plan forces (server/password-hash.ts).
 */
export const MIN_PASSWORD_LENGTH = 10

// Characters as a person counts them (grapheme clusters): "🔥" or "é" is one.
// JavaScript's .length counts UTF-16 units, so five emoji would pass for ten.
const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

export function isPasswordTooShort(password: string): boolean {
  return Array.from(graphemes.segment(password)).length < MIN_PASSWORD_LENGTH
}
export const PASSWORD_TOO_SHORT = `Use at least ${MIN_PASSWORD_LENGTH} characters. A few words in a row is easy to remember.`
