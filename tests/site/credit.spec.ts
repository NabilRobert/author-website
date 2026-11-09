import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory } from 'vue-router'
import { createHead } from '@unhead/vue/client'
import App from '@/App.vue'
import { createAppRouter } from '@/router'
import SitePreview from '@/editor/SitePreview.vue'
import { demoContent } from '@shared/demo-content'
import { fakeApi, json } from '../fake-api'

afterEach(() => vi.unstubAllGlobals())

async function render(path: string) {
  fakeApi({ 'GET /api/sites/mara/content': json(demoContent) })
  const router = createAppRouter(createMemoryHistory())
  await router.push(path)
  const page = mount(App, { global: { plugins: [router, createHead()] } })
  await flushPromises()
  return page
}

function expectCredit(text: string, credit: ReturnType<ReturnType<typeof mount>['find']>) {
  expect(credit.exists()).toBe(true)
  expect(text).toContain('Made with Framed by @nabilrobert')
  expect(credit.find('a[href="https://github.com/NabilRobert"]').exists()).toBe(true)
}

describe('the Framed credit', () => {
  it.each(['/mara', '/mara/books', '/', '/login', '/terms', '/privacy'])('is in the footer of %s', async (path) => {
    const page = await render(path)
    expectCredit(page.find('footer').text(), page.find('footer [data-framed-credit]'))
  })

  it("is in the footer of the editor's preview", () => {
    const pageId = demoContent.pages[0]!.id
    const router = createAppRouter(createMemoryHistory())
    const preview = mount(SitePreview, { props: { content: demoContent, pageId }, global: { plugins: [router] } })
    expectCredit(preview.find('footer').text(), preview.find('footer [data-framed-credit]'))
  })
})

describe("the editor's preview", () => {
  function mountPreview() {
    const router = createAppRouter(createMemoryHistory())
    const pageId = demoContent.pages[0]!.id
    const preview = mount(SitePreview, { props: { content: demoContent, pageId }, global: { plugins: [router] } })
    return { preview, router }
  }

  it('lets the owner select text (it is not inert)', () => {
    expect(mountPreview().preview.find('[inert]').exists()).toBe(false)
  })

  it('does not follow links, so the editor stays open', async () => {
    const { preview, router } = mountPreview()
    await router.push('/mara/edit')
    await preview.find('a[href="/books"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/mara/edit')
  })
})
