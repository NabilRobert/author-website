import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory } from 'vue-router'
import { createHead } from '@unhead/vue/client'
import App from '@/App.vue'
import { createAppRouter } from '@/router'
import { fakeApi, json } from '../fake-api'
import type { FakeAnswer } from '../fake-api'

// The Better Auth client talks to /api/auth; here it is replaced by a
// stand-in whose answers each test sets.
const authClient = vi.hoisted(() => ({
  signIn: { email: vi.fn() },
  signUp: { email: vi.fn() },
  emailOtp: {
    sendVerificationOtp: vi.fn(),
    verifyEmail: vi.fn(),
    requestPasswordReset: vi.fn(),
    resetPassword: vi.fn(),
  },
  signOut: vi.fn(),
}))
vi.mock('@/auth/authClient', () => ({ authClient }))

const OK = { data: {}, error: null }
const MARA = { email: 'mara@example.com', site: { name: 'mara' } }
const PASSWORD = 'correct horse battery'

beforeEach(() => {
  for (const method of [authClient.signIn.email, authClient.signUp.email, ...Object.values(authClient.emailOtp)]) {
    method.mockResolvedValue(OK)
  }
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

async function openLogin(answers: Record<string, FakeAnswer>, path = '/login') {
  fakeApi(answers)
  const router = createAppRouter(createMemoryHistory())
  await router.push(path)
  const page = mount(App, { global: { plugins: [router, createHead()] } })
  await flushPromises()
  return { page, router }
}
type Page = Awaited<ReturnType<typeof openLogin>>['page']

async function fillIn(page: Page, fields: Record<string, string>) {
  for (const [selector, value] of Object.entries(fields)) await page.find(selector).setValue(value)
  await page.find('form').trigger('submit')
  await flushPromises()
}

async function clickButton(page: Page, text: string) {
  await page
    .findAll('button')
    .find((button) => button.text() === text)!
    .trigger('click')
}

const alertText = (page: Page) => page.find('[role="alert"]').text()

describe('logging in', () => {
  it('logs someone with a page straight into their editor', async () => {
    const { page, router } = await openLogin({ 'GET /api/me': json(MARA), 'GET /api/me/content': json({}, 404) })
    await fillIn(page, { '#login-email': 'mara@example.com', '#login-password': PASSWORD })
    expect(authClient.signIn.email).toHaveBeenCalledWith({ email: 'mara@example.com', password: PASSWORD })
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/mara/edit'))
  })

  it('explains a wrong email or password', async () => {
    authClient.signIn.email.mockResolvedValue({ data: null, error: { status: 401 } })
    const { page } = await openLogin({})
    await fillIn(page, { '#login-email': 'mara@example.com', '#login-password': 'wrong one' })
    expect(alertText(page)).toContain("That email and password don't match")
  })

  it('sends a new confirmation code when the email was never confirmed', async () => {
    authClient.signIn.email.mockResolvedValue({ data: null, error: { status: 403 } })
    const { page } = await openLogin({})
    await fillIn(page, { '#login-email': 'mara@example.com', '#login-password': PASSWORD })
    expect(authClient.emailOtp.sendVerificationOtp).toHaveBeenCalledWith({
      email: 'mara@example.com',
      type: 'email-verification',
    })
    expect(page.find('h1').text()).toBe('Check your email')
  })

  it('explains too many tries', async () => {
    authClient.signIn.email.mockResolvedValue({ data: null, error: { status: 429 } })
    const { page } = await openLogin({})
    await fillIn(page, { '#login-email': 'mara@example.com', '#login-password': PASSWORD })
    expect(alertText(page)).toContain('Wait a minute')
  })

  it('returns to where it was sent from, but only within Framed', async () => {
    const answers = { 'GET /api/me': json(MARA), 'GET /api/sites/mara/content': json({ reason: 'not-set-up' }, 404) }
    const { page, router } = await openLogin(answers, '/login?next=//evil.example')
    fakeApi({ ...answers, 'GET /api/me/content': json({}, 404) })
    await fillIn(page, { '#login-email': 'mara@example.com', '#login-password': PASSWORD })
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/mara/edit'))
  })
})

describe('making an account', () => {
  async function startSignUp(answers: Record<string, FakeAnswer> = {}) {
    const opened = await openLogin(answers)
    await clickButton(opened.page, 'New here? Make an account')
    return opened
  }

  it('confirms the email with the emailed code, then asks for the page address', async () => {
    const { page, router } = await startSignUp({ 'GET /api/me': json({ email: 'new@example.com', site: null }) })
    await fillIn(page, { '#login-email': 'new@example.com', '#login-password': PASSWORD })
    expect(authClient.signUp.email).toHaveBeenCalledWith({ email: 'new@example.com', password: PASSWORD, name: '' })
    await fillIn(page, { '#login-code': '123456' })
    expect(authClient.emailOtp.verifyEmail).toHaveBeenCalledWith({ email: 'new@example.com', otp: '123456' })
    expect(page.text()).toContain("Pick your page's address")
    fakeApi({
      'POST /api/me/site': json({ name: 'new-maker' }, 201),
      'GET /api/me': json({ email: 'new@example.com', site: { name: 'new-maker' } }),
      'GET /api/me/content': json({}, 404),
    })
    await fillIn(page, { '#login-name': 'new-maker' })
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/new-maker/edit'))
  })

  it('refuses a short password before asking the server', async () => {
    const { page } = await startSignUp()
    await fillIn(page, { '#login-email': 'new@example.com', '#login-password': 'short' })
    expect(authClient.signUp.email).not.toHaveBeenCalled()
    expect(alertText(page)).toContain('Use at least 10 characters')
  })

  it("passes on the server's warning about a leaked password", async () => {
    const leaked = {
      status: 400,
      code: 'PASSWORD_COMPROMISED',
      message: 'That password has appeared in a data breach.',
    }
    authClient.signUp.email.mockResolvedValue({ data: null, error: leaked })
    const { page } = await startSignUp()
    await fillIn(page, { '#login-email': 'new@example.com', '#login-password': 'password1234' })
    expect(alertText(page)).toBe('That password has appeared in a data breach.')
  })

  it('explains a wrong code', async () => {
    authClient.emailOtp.verifyEmail.mockResolvedValue({ data: null, error: { status: 400 } })
    const { page } = await startSignUp()
    await fillIn(page, { '#login-email': 'new@example.com', '#login-password': PASSWORD })
    await fillIn(page, { '#login-code': '000000' })
    expect(alertText(page)).toBe('That code is wrong or has expired. Check it, or ask for a new one.')
  })

  it('refuses a reserved address before asking the server', async () => {
    const { page } = await startSignUp({ 'GET /api/me': json({ email: 'new@example.com', site: null }) })
    await fillIn(page, { '#login-email': 'new@example.com', '#login-password': PASSWORD })
    await fillIn(page, { '#login-code': '123456' })
    await fillIn(page, { '#login-name': 'edit' })
    expect(alertText(page)).toBe('That name is used by Framed itself. Pick another.')
  })
})

describe('resetting a forgotten password', () => {
  it('emails a code, sets the new password with it, and logs in', async () => {
    const { page, router } = await openLogin({ 'GET /api/me': json(MARA), 'GET /api/me/content': json({}, 404) })
    await clickButton(page, 'Forgot your password?')
    await fillIn(page, { '#login-email': 'mara@example.com' })
    expect(authClient.emailOtp.requestPasswordReset).toHaveBeenCalledWith({ email: 'mara@example.com' })
    await fillIn(page, { '#login-code': '123456', '#login-password': 'a new passphrase' })
    expect(authClient.emailOtp.resetPassword).toHaveBeenCalledWith({
      email: 'mara@example.com',
      otp: '123456',
      password: 'a new passphrase',
    })
    expect(authClient.signIn.email).toHaveBeenCalledWith({ email: 'mara@example.com', password: 'a new passphrase' })
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/mara/edit'))
  })
})

describe('the landing page', () => {
  it('invites people to make their page', async () => {
    const { page } = await openLogin({}, '/')
    expect(page.find('h1').text()).toBe('Your work, framed.')
    expect(page.find('a[href="/login"]').exists()).toBe(true)
  })
})
