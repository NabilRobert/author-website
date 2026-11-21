/**
 * Accounts, with Better Auth: people sign up and log in with their email
 * and a password. Emailed 6-digit codes (the emailOTP plugin) confirm the
 * email address at sign-up and reset a forgotten password. Better Auth
 * keeps people, password hashes, sessions, pending codes and rate limits in
 * our D1 (migrations/0001).
 *
 * A new instance per request, because Cloudflare passes the bindings (the
 * database, the secrets) with each request.
 */
import { betterAuth } from 'better-auth'
import type { BetterAuthOptions } from 'better-auth'
import { emailOTP, haveIBeenPwned } from 'better-auth/plugins'
import { APIError, createAuthMiddleware } from 'better-auth/api'
import type { Env } from './env'
import type { SendEmailCode } from './email'
import { hashPassword, verifyPassword } from './password-hash'
import { isPasswordTooShort, MIN_PASSWORD_LENGTH, PASSWORD_TOO_SHORT } from '../shared/passwords'

const CODE_LENGTH = 6
const CODE_LIFETIME_SECONDS = 10 * 60
const WRONG_CODE_TRIES = 5
// A login lasts a week and is renewed once a day while in use.
const SESSION_SECONDS = 7 * 24 * 60 * 60
const SESSION_RENEW_SECONDS = 24 * 60 * 60
const LEAKED_PASSWORD = 'That password has appeared in a data breach, so attackers try it first. Pick a different one.'

// What an attacker would repeat: guessing passwords, and sending codes.
const PER_MINUTE = (max: number) => ({ window: 60, max })
const RATE_LIMITS = {
  '/sign-in/email': PER_MINUTE(5),
  '/sign-up/email': PER_MINUTE(3),
  '/email-otp/send-verification-otp': PER_MINUTE(3),
  '/email-otp/request-password-reset': PER_MINUTE(3),
  '/email-otp/verify-email': PER_MINUTE(5),
  '/email-otp/reset-password': PER_MINUTE(5),
}

// Where a new password is chosen, and the field it comes in. Logging in is
// left out on purpose: an older, shorter password must still work.
const NEW_PASSWORD_FIELDS: Record<string, 'password' | 'newPassword'> = {
  '/sign-up/email': 'password',
  '/email-otp/reset-password': 'password',
  '/reset-password': 'newPassword',
  '/change-password': 'newPassword',
}

// Better Auth's own minimum counts UTF-16 units, so 5 emoji pass for 10
// characters; this counts what people see (shared/passwords.ts).
const refuseShortPasswords = createAuthMiddleware(async (ctx) => {
  const field = NEW_PASSWORD_FIELDS[ctx.path]
  const password: unknown = field ? ctx.body?.[field] : undefined
  if (typeof password === 'string' && isPasswordTooShort(password)) {
    throw new APIError('BAD_REQUEST', { code: 'PASSWORD_TOO_SHORT', message: PASSWORD_TOO_SHORT })
  }
})

export function createAuth(env: Env, sendEmailCode: SendEmailCode) {
  return betterAuth({
    // D1 on Cloudflare; on the Node version, the SQLite file itself (server/node/main.ts).
    database: (env.SQLITE_DATABASE ?? env.DB) as BetterAuthOptions['database'],
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.SITE_URL,
    basePath: '/api/auth',
    trustedOrigins: [env.SITE_URL],
    // Logging in with a code instead of the password is switched off; codes
    // only confirm emails and reset passwords. The older reset path is off
    // so there is one way to do it.
    disabledPaths: ['/sign-in/email-otp', '/forget-password/email-otp'],
    emailAndPassword: {
      enabled: true,
      minPasswordLength: MIN_PASSWORD_LENGTH,
      requireEmailVerification: true,
      revokeSessionsOnPasswordReset: true,
      password: { hash: hashPassword, verify: verifyPassword },
    },
    hooks: { before: refuseShortPasswords },
    emailVerification: { autoSignInAfterVerification: true },
    // Cookies are HttpOnly, Secure (on https) and SameSite=Lax by default.
    session: { expiresIn: SESSION_SECONDS, updateAge: SESSION_RENEW_SECONDS },
    advanced: { ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] } },
    rateLimit: { enabled: true, storage: 'database', customRules: RATE_LIMITS },
    plugins: [
      emailOTP({
        otpLength: CODE_LENGTH,
        expiresIn: CODE_LIFETIME_SECONDS,
        allowedAttempts: WRONG_CODE_TRIES,
        storeOTP: 'hashed',
        overrideDefaultEmailVerification: true,
        sendVerificationOnSignUp: true,
        disableSignUp: true,
        sendVerificationOTP: ({ email, otp, type }) => {
          if (type === 'sign-in' || type === 'change-email') throw new Error(`Codes for ${type} are switched off.`)
          return sendEmailCode(email, otp, type)
        },
      }),
      // Sends only the first 5 characters of the password's SHA-1 hash to
      // api.pwnedpasswords.com (k-anonymity); never the password.
      haveIBeenPwned({ customPasswordCompromisedMessage: LEAKED_PASSWORD }),
    ],
  })
}

export type Auth = ReturnType<typeof createAuth>
