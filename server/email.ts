/**
 * Sends the 6-digit login code. In production through Resend's HTTP API
 * (free tier: 3,000 emails a month); in local development it can print the
 * code in the terminal instead.
 */
import type { Env } from './env'

export type SendLoginCode = (email: string, code: string) => Promise<void>

const RESEND_URL = 'https://api.resend.com/emails'

export function loginCodeSender(env: Env): SendLoginCode {
  if (env.LOCAL_DEV_PRINT_CODES === 'true') {
    return async (email, code) => console.log(`Login code for ${email}: ${code}`)
  }
  return async (email, code) => {
    if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
      throw new Error('RESEND_API_KEY or EMAIL_FROM is not set: add them as secrets (README, setup checklist).')
    }
    const response = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: email,
        subject: `Your Framed login code: ${code}`,
        text: `Your code is ${code}. It works for 10 minutes.\n\nIf you didn't ask for it, ignore this email.`,
      }),
    })
    if (!response.ok) throw new Error(`Resend refused the login email: ${response.status} ${await response.text()}`)
  }
}
