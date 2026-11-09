import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory } from 'vue-router'
import { createHead } from '@unhead/vue/client'
import App from '@/App.vue'
import { createAppRouter } from '@/router'
import SitePreview from '@/editor/SitePreview.vue'
import { blockSchema } from '@shared/blocks'
import type { Block } from '@shared/blocks'
import { demoContent } from '@shared/demo-content'
import { plainBox } from '@shared/theme'
import { fakeApi, json } from '../fake-api'
import type { FakeAnswer } from '../fake-api'

afterEach(() => vi.unstubAllGlobals())

const form = blockSchema.parse({
  id: crypto.randomUUID(),
  style: plainBox(),
  type: 'contactForm',
  heading: 'Get in touch',
  intro: 'Tell me about your project.',
}) as Block
const [home, ...otherPages] = demoContent.pages
const contact = otherPages.find((page) => page.slug === 'contact')!
const content = {
  ...demoContent,
  pages: [home!, ...otherPages.map((page) => (page === contact ? { ...page, blocks: [form] } : page))],
}

async function openContactPage(messageAnswer: FakeAnswer) {
  const api = fakeApi({ 'GET /api/sites/mara/content': json(content), 'POST /api/sites/mara/messages': messageAnswer })
  const router = createAppRouter(createMemoryHistory())
  await router.push('/mara/contact')
  const page = mount(App, { global: { plugins: [router, createHead()] } })
  await flushPromises()
  return { page, api }
}

async function fillAndSend(page: ReturnType<typeof mount>) {
  const inputs = page.findAll('form input, form textarea')
  await inputs[0]!.setValue('Sam Visitor')
  await inputs[1]!.setValue('sam@example.org')
  await page.find('form textarea').setValue('Could you design our signs?')
  await page.find('form').trigger('submit')
  await flushPromises()
}

describe('a contact form', () => {
  it("sends the visitor's message to the site and thanks them", async () => {
    const { page, api } = await openContactPage(json({ ok: true }, 201))
    await fillAndSend(page)
    const sent = api.calls.find((call) => call.method === 'POST')!
    expect(JSON.parse(String(sent.init!.body))).toEqual({
      name: 'Sam Visitor',
      email: 'sam@example.org',
      message: 'Could you design our signs?',
      website: '',
    })
    expect(page.find('[role="status"]').text()).toContain('Your message is on its way')
  })

  it("shows the server's reason when it refuses", async () => {
    const { page } = await openContactPage(json({ error: 'Please wait an hour.' }, 429))
    await fillAndSend(page)
    expect(page.find('[role="alert"]').text()).toBe('Please wait an hour.')
    expect(page.find('form').exists()).toBe(true)
  })

  it('asks for an email before sending anything', async () => {
    const { page, api } = await openContactPage(json({ ok: true }, 201))
    await page.find('form').trigger('submit')
    await flushPromises()
    expect(page.find('[role="alert"]').text()).toBe('Add your name.')
    expect(api.calls.some((call) => call.method === 'POST')).toBe(false)
  })

  it("never sends from the editor's preview", async () => {
    const api = fakeApi({})
    const router = createAppRouter(createMemoryHistory())
    const preview = mount(SitePreview, { props: { content, pageId: contact.id }, global: { plugins: [router] } })
    await fillAndSend(preview)
    expect(api.calls).toEqual([])
    expect(preview.find('[role="alert"]').text()).toContain('sent from your published page')
  })
})
