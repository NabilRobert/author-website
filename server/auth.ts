/**
 * Login, with Better Auth: people type their email, get a 6-digit code,
 * and type it in. No passwords. Better Auth keeps its people, sessions,
 * pending codes and rate limits in our D1 (migrations/0001).
 *
 * A new instance per request, because Cloudflare passes the bindings (the
 * database, the secrets) with each request.
 */
import { betterAuth } from 'better-auth'
import { emailOTP } from 'better-auth/plugins'
import type { Env } from './env'
import type { SendLoginCode } from './email'

const CODE_LENGTH = 6
const CODE_LIFETIME_SECONDS = 10 * 60
const WRONG_CODE_TRIES = 5
// A login lasts a week and is renewed once a day while in use.
const SESSION_SECONDS = 7 * 24 * 60 * 60
const SESSION_RENEW_SECONDS = 24 * 60 * 60

export function createAuth(env: Env, sendLoginCode: SendLoginCode) {
  return betterAuth({
    database: env.DB,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.SITE_URL,
    basePath: '/api/auth',
    trustedOrigins: [env.SITE_URL],
    // Cookies are HttpOnly, Secure (on https) and SameSite=Lax by default.
    session: { expiresIn: SESSION_SECONDS, updateAge: SESSION_RENEW_SECONDS },
    advanced: { ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] } },
    rateLimit: {
      enabled: true,
      storage: 'database',
      // Asking for codes is what an attacker would repeat: 3 a minute per address.
      customRules: { '/email-otp/send-verification-otp': { window: 60, max: 3 } },
    },
    plugins: [
      emailOTP({
        otpLength: CODE_LENGTH,
        expiresIn: CODE_LIFETIME_SECONDS,
        allowedAttempts: WRONG_CODE_TRIES,
        storeOTP: 'hashed',
        sendVerificationOTP: ({ email, otp }) => sendLoginCode(email, otp),
      }),
    ],
  })
}

export type Auth = ReturnType<typeof createAuth>
