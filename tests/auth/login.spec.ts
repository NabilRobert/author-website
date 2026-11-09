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
  emailOtp: { sendVerificationOtp: vi.fn() },
  signIn: { emailOtp: vi.fn() },
  signOut: vi.fn(),
}))
vi.mock('@/auth/authClient', () => ({ authClient }))

beforeEach(() => {
  authClient.emailOtp.sendVerificationOtp.mockResolvedValue({ data: {}, error: null })
  authClient.signIn.emailOtp.mockResolvedValue({ data: {}, error: null })
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

async function typeAndSubmit(page: Awaited<ReturnType<typeof openLogin>>['page'], selector: string, value: string) {
  await page.find(selector).setValue(value)
  await page.find('form').trigger('submit')
  await flushPromises()
}

describe('the login page', () => {
  it('logs someone with a page straight into their editor', async () => {
    const { page, router } = await openLogin({
      'GET /api/me': json({ email: 'mara@example.com', site: { name: 'mara' } }),
      'GET /api/me/content': json({ error: 'empty' }, 404),
    })
    await typeAndSubmit(page, '#login-email', 'mara@example.com')
    expect(authClient.emailOtp.sendVerificationOtp).toHaveBeenCalledWith({ email: 'mara@example.com', type: 'sign-in' })
    await typeAndSubmit(page, '#login-code', '123456')
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/mara/edit'))
  })

  it('asks a new person to pick their address, then opens their editor', async () => {
    const { page, router } = await openLogin({
      'GET /api/me': json({ email: 'new@example.com', site: null }),
      'POST /api/me/site': json({ name: 'new-writer' }, 201),
    })
    await typeAndSubmit(page, '#login-email', 'new@example.com')
    await typeAndSubmit(page, '#login-code', '123456')
    expect(page.text()).toContain("Pick your page's address")
    fakeApi({
      'POST /api/me/site': json({ name: 'new-writer' }, 201),
      'GET /api/me': json({ email: 'new@example.com', site: { name: 'new-writer' } }),
      'GET /api/me/content': json({ error: 'empty' }, 404),
    })
    await typeAndSubmit(page, '#login-name', 'new-writer')
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/new-writer/edit'))
  })

  it('explains a wrong code', async () => {
    authClient.signIn.emailOtp.mockResolvedValue({ data: null, error: { status: 400 } })
    const { page } = await openLogin({})
    await typeAndSubmit(page, '#login-email', 'mara@example.com')
    await typeAndSubmit(page, '#login-code', '000000')
    expect(page.find('[role="alert"]').text()).toBe(
      'That code is wrong or has expired. Check it, or ask for a new one.',
    )
  })

  it('explains too many code requests', async () => {
    authClient.emailOtp.sendVerificationOtp.mockResolvedValue({ data: null, error: { status: 429 } })
    const { page } = await openLogin({})
    await typeAndSubmit(page, '#login-email', 'mara@example.com')
    expect(page.find('[role="alert"]').text()).toContain('Wait a minute')
  })

  it('refuses a reserved address before asking the server', async () => {
    const { page } = await openLogin({ 'GET /api/me': json({ email: 'new@example.com', site: null }) })
    await typeAndSubmit(page, '#login-email', 'new@example.com')
    await typeAndSubmit(page, '#login-code', '123456')
    await typeAndSubmit(page, '#login-name', 'edit')
    expect(page.find('[role="alert"]').text()).toBe('That name is used by Framed itself. Pick another.')
  })

  it('returns to where it was sent from, but only within Framed', async () => {
    const answers = {
      'GET /api/me': json({ email: 'mara@example.com', site: { name: 'mara' } }),
      'GET /api/sites/mara/content': json({ error: 'x', reason: 'not-set-up' }, 404),
    }
    const { page, router } = await openLogin(answers, '/login?next=//evil.example')
    await typeAndSubmit(page, '#login-email', 'mara@example.com')
    fakeApi({ ...answers, 'GET /api/me/content': json({ error: 'empty' }, 404) })
    await typeAndSubmit(page, '#login-code', '123456')
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
