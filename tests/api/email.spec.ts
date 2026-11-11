// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { emailCodeSender } from '../../server/email'
import type { Env } from '../../server/env'

const BASE: Env = {
  DB: {} as D1Database,
  IMAGES: {} as R2Bucket,
  SITE_URL: 'https://framed.my.id',
  BETTER_AUTH_SECRET: 'x'.repeat(32),
}
const PRODUCTION: Env = { ...BASE, RESEND_API_KEY: 're_test_key', EMAIL_FROM: 'Framed <login@framed.my.id>' }

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('sending emailed codes', () => {
  it('emails the code through Resend with the API key', async () => {
    const fetchStub = vi.fn(async () => Response.json({ id: 'email-1' }))
    vi.stubGlobal('fetch', fetchStub)
    await emailCodeSender(PRODUCTION)('mara@example.com', '123456', 'forget-password')
    const [url, init] = fetchStub.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://api.resend.com/emails')
    expect(init.headers).toMatchObject({ Authorization: 'Bearer re_test_key' })
    const body = JSON.parse(String(init.body)) as Record<string, string>
    expect(body).toMatchObject({ from: 'Framed <login@framed.my.id>', to: 'mara@example.com' })
    expect(body.subject).toContain('123456')
    expect(body.text).toContain('123456')
  })

  it('says in the subject what the code is for', async () => {
    const fetchStub = vi.fn(async () => Response.json({ id: 'email-1' }))
    vi.stubGlobal('fetch', fetchStub)
    await emailCodeSender(PRODUCTION)('mara@example.com', '123456', 'email-verification')
    const [, init] = fetchStub.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(String(init.body))).toMatchObject({ subject: 'Confirm your email for Framed: 123456' })
  })

  it('fails loudly when Resend refuses, so the login page can say the code was not sent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('domain not verified', { status: 403 })),
    )
    await expect(emailCodeSender(PRODUCTION)('mara@example.com', '123456', 'forget-password')).rejects.toThrow(
      'Resend refused',
    )
  })

  it('says what to set when the Resend key is missing', async () => {
    await expect(emailCodeSender(BASE)('mara@example.com', '123456', 'forget-password')).rejects.toThrow(
      'RESEND_API_KEY',
    )
  })

  it('prints the code instead of emailing it in local development', async () => {
    const fetchStub = vi.fn()
    vi.stubGlobal('fetch', fetchStub)
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const local = { ...PRODUCTION, SITE_URL: 'http://localhost:8788', LOCAL_DEV_PRINT_CODES: 'true' }
    await emailCodeSender(local)('mara@example.com', '123456', 'forget-password')
    expect(fetchStub).not.toHaveBeenCalled()
    expect(log).toHaveBeenCalledWith('Reset your Framed password (mara@example.com): 123456')
  })

  it('ignores the print-codes setting on a real site, so codes never land in server logs', async () => {
    const fetchStub = vi.fn(async () => new Response('{}'))
    vi.stubGlobal('fetch', fetchStub)
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    await emailCodeSender({ ...PRODUCTION, LOCAL_DEV_PRINT_CODES: 'true' })(
      'mara@example.com',
      '123456',
      'forget-password',
    )
    expect(fetchStub).toHaveBeenCalledOnce()
    expect(log).not.toHaveBeenCalled()
  })
})
