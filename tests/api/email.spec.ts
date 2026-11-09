// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { loginCodeSender } from '../../server/email'
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

describe('sending login codes', () => {
  it('emails the code through Resend with the API key', async () => {
    const fetchStub = vi.fn(async () => Response.json({ id: 'email-1' }))
    vi.stubGlobal('fetch', fetchStub)
    await loginCodeSender(PRODUCTION)('mara@example.com', '123456')
    const [url, init] = fetchStub.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://api.resend.com/emails')
    expect(init.headers).toMatchObject({ Authorization: 'Bearer re_test_key' })
    const body = JSON.parse(String(init.body)) as Record<string, string>
    expect(body).toMatchObject({ from: 'Framed <login@framed.my.id>', to: 'mara@example.com' })
    expect(body.subject).toContain('123456')
    expect(body.text).toContain('123456')
  })

  it('fails loudly when Resend refuses, so the login page can say the code was not sent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('domain not verified', { status: 403 })),
    )
    await expect(loginCodeSender(PRODUCTION)('mara@example.com', '123456')).rejects.toThrow('Resend refused')
  })

  it('says what to set when the Resend key is missing', async () => {
    await expect(loginCodeSender(BASE)('mara@example.com', '123456')).rejects.toThrow('RESEND_API_KEY')
  })

  it('prints the code instead of emailing it in local development', async () => {
    const fetchStub = vi.fn()
    vi.stubGlobal('fetch', fetchStub)
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    await loginCodeSender({ ...PRODUCTION, LOCAL_DEV_PRINT_CODES: 'true' })('mara@example.com', '123456')
    expect(fetchStub).not.toHaveBeenCalled()
    expect(log).toHaveBeenCalledWith('Login code for mara@example.com: 123456')
  })
})
