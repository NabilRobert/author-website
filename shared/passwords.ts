/**
 * Password rules shared by the login page (checked before sending) and
 * Better Auth (server/auth.ts, checked again).
 *
 * NIST SP 800-63B asks for at least 8 characters; 10 leaves room for the
 * weaker hashing Cloudflare's free plan forces (server/password-hash.ts).
 */
export const MIN_PASSWORD_LENGTH = 10
export const PASSWORD_TOO_SHORT = `Use at least ${MIN_PASSWORD_LENGTH} characters. A few words in a row is easy to remember.`
