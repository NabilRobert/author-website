import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory } from 'vue-router'
import { createHead } from '@unhead/vue/client'
import App from '@/App.vue'
import { createAppRouter } from '@/router'
import { forgetAccount, refreshAccount } from '@/auth/useAccount'
import { demoContent } from '@shared/demo-content'
import { fakeApi, json } from '../fake-api'
import type { FakeAnswer } from '../fake-api'

const authClient = vi.hoisted(() => ({
  emailOtp: { sendVerificationOtp: vi.fn() },
  signIn: { emailOtp: vi.fn() },
  signOut: vi.fn(),
}))
vi.mock('@/auth/authClient', () => ({ authClient }))

const MARA = { email: 'mara@example.com', site: { name: 'mara' } }
const SITE = { 'GET /api/sites/mara/content': json(demoContent) }

beforeEach(() => {
  forgetAccount()
  localStorage.clear()
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

async function open(path: string, answers: Record<string, FakeAnswer>) {
  fakeApi(answers)
  await refreshAccount()
  const router = createAppRouter(createMemoryHistory())
  await router.push(path)
  const page = mount(App, { global: { plugins: [router, createHead()] }, attachTo: document.body })
  await flushPromises()
  return { page, router }
}

describe('the owner bar', () => {
  it('lets the owner switch to editing the page they are viewing', async () => {
    const { page } = await open('/mara/work', { ...SITE, 'GET /api/me': json(MARA) })
    const edit = page.find('[aria-label="Your page"] a')
    expect(edit.text()).toBe('Edit this page')
    expect(edit.attributes('href')).toBe('/mara/edit?page=work')
    page.unmount()
  })

  it("opens the editor on a work's own page from that page", async () => {
    const { page } = await open('/mara/work/lantern', { ...SITE, 'GET /api/me': json(MARA) })
    expect(page.find('[aria-label="Your page"] a').attributes('href')).toBe('/mara/edit?work=lantern')
    page.unmount()
  })

  it('is not shown to visitors', async () => {
    const { page } = await open('/mara', { ...SITE, 'GET /api/me': json({ error: 'x' }, 401) })
    expect(page.find('[aria-label="Your page"]').exists()).toBe(false)
    page.unmount()
  })

  it("is not shown on someone else's page", async () => {
    const other = { email: 'bob@example.com', site: { name: 'bob' } }
    const { page } = await open('/mara', { ...SITE, 'GET /api/me': json(other) })
    expect(page.find('[aria-label="Your page"]').exists()).toBe(false)
    page.unmount()
  })
})

describe('the editor', () => {
  const editorApi = {
    ...SITE,
    'GET /api/me': json(MARA),
    'GET /api/me/content': json({ ...demoContent, updatedAt: 'saved' }),
  }

  it('opens on the page the owner was viewing, and Done returns to it', async () => {
    const { page, router } = await open('/mara/edit?page=work', editorApi)
    expect(page.find('section[aria-label="Preview"] select').element).toHaveProperty('value', demoContent.pages[1]!.id)
    await page
      .findAll('button')
      .find((button) => button.text() === 'Done')!
      .trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/mara/work'))
    page.unmount()
  })

  it("opens ready to edit a work's own page with ?work, and Done returns to it", async () => {
    const { page, router } = await open('/mara/edit?work=lantern', editorApi)
    expect(page.find('section[aria-label="Preview"] h1').text()).toBe('Lantern')
    expect(page.find('section[aria-label="Edit"]').text()).toContain('Page of “Lantern”')
    await page
      .findAll('button')
      .find((button) => button.text() === 'Done')!
      .trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/mara/work/lantern'))
    page.unmount()
  })

  it('asks before leaving with unsaved changes', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { page, router } = await open('/mara/edit', editorApi)
    await page.find('section[aria-label^="Block 1"] input[type="text"]').setValue('Changed')
    await page
      .findAll('button')
      .find((button) => button.text() === 'Done')!
      .trigger('click')
    await flushPromises()
    expect(confirm).toHaveBeenCalled()
    expect(router.currentRoute.value.fullPath).toBe('/mara/edit')
    page.unmount()
  })
})

describe("Framed's header", () => {
  it('shows "My page" to someone logged in', async () => {
    const { page } = await open('/', { 'GET /api/me': json(MARA) })
    const link = page.find('header a[href="/mara"]')
    expect(link.text()).toBe('My page')
    page.unmount()
  })
})
