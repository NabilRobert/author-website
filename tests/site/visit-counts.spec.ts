import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory } from 'vue-router'
import { createHead } from '@unhead/vue/client'
import App from '@/App.vue'
import { createAppRouter } from '@/router'
import { refreshAccount } from '@/auth/useAccount'
import { demoContent } from '@shared/demo-content'
import { fakeApi, json } from '../fake-api'
import type { FakeAnswer } from '../fake-api'

const mounted: { unmount: () => void }[] = []
afterEach(() => {
  for (const app of mounted.splice(0)) app.unmount()
  vi.unstubAllGlobals()
})

async function visit(path: string, me: FakeAnswer) {
  const api = fakeApi({
    'GET /api/me': me,
    'GET /api/sites/mara/content': json(demoContent),
    'POST /api/sites/mara/visits': () => new Response(null, { status: 204 }),
  })
  await refreshAccount()
  const router = createAppRouter(createMemoryHistory())
  await router.push(path)
  mounted.push(mount(App, { global: { plugins: [router, createHead()] } }))
  await flushPromises()
  const counted = api.calls.filter((call) => call.path === '/api/sites/mara/visits')
  return counted.map((call) => JSON.parse(String(call.init!.body)) as { path: string })
}

const VISITOR = json({ error: 'Not logged in' }, 401)
const OWNER = json({ email: 'mara@example.com', site: { name: 'mara' } })

describe('visit counts', () => {
  it("counts a visitor's view of a page, by its address within the site", async () => {
    expect(await visit('/mara/work/lantern', VISITOR)).toEqual([{ path: '/work/lantern' }])
  })

  it('counts the front page as "/"', async () => {
    expect(await visit('/mara', VISITOR)).toEqual([{ path: '/' }])
  })

  it("doesn't count the owner looking at their own page", async () => {
    expect(await visit('/mara/about', OWNER)).toEqual([])
  })

  it("doesn't count an address the site has no page at", async () => {
    expect(await visit('/mara/no-such-page', VISITOR)).toEqual([])
  })
})
