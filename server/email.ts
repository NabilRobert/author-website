/**
 * Sends the 6-digit codes Framed emails: one to confirm an email address at
 * sign-up, and one to reset a forgotten password. In production through
 * Resend's HTTP API (free tier: 3,000 emails a month); in local development
 * it can print the code in the terminal instead.
 */
import type { Env } from './env'

export type CodePurpose = 'email-verification' | 'forget-password'
export type SendEmailCode = (email: string, code: string, purpose: CodePurpose) => Promise<void>

const RESEND_URL = 'https://api.resend.com/emails'

// What each email says; both codes work for 10 minutes (server/auth.ts).
const MESSAGES: Record<CodePurpose, { subject: string; use: string }> = {
  'email-verification': {
    subject: 'Confirm your email for Framed',
    use: 'Type it on the sign-up page to confirm this is your email.',
  },
  'forget-password': {
    subject: 'Reset your Framed password',
    use: 'Type it on the "Forgot your password?" page, then choose a new password.',
  },
}

export function emailCodeSender(env: Env): SendEmailCode {
  if (env.LOCAL_DEV_PRINT_CODES === 'true') {
    return async (email, code, purpose) => console.log(`${MESSAGES[purpose].subject} (${email}): ${code}`)
  }
  return async (email, code, purpose) => {
    if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
      throw new Error('RESEND_API_KEY or EMAIL_FROM is not set: add them as secrets (README, setup checklist).')
    }
    const { subject, use } = MESSAGES[purpose]
    const response = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: email,
        subject: `${subject}: ${code}`,
        text: `Your code is ${code}. ${use} It works for 10 minutes.\n\nIf you didn't ask for it, ignore this email.`,
      }),
    })
    if (!response.ok) throw new Error(`Resend refused the email: ${response.status} ${await response.text()}`)
  }
}
