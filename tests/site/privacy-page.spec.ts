import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory } from 'vue-router'
import { createHead } from '@unhead/vue/client'
import App from '@/App.vue'
import { createAppRouter } from '@/router'
import { CODE_LIFETIME_MINUTES, SIGN_IN_LOCK_MINUTES, VISIT_KEEP_DAYS } from '@shared/retention'

// The privacy page states how long things are kept; it reads the numbers from
// shared/retention.ts, the same constants the server uses.
async function privacyPageText(): Promise<string> {
  const router = createAppRouter(createMemoryHistory())
  await router.push('/privacy')
  const page = mount(App, { global: { plugins: [router, createHead()] } })
  await flushPromises()
  return page.text()
}

describe('the privacy page', () => {
  it('states how long the server keeps page views, lockouts and emailed codes', async () => {
    const text = await privacyPageText()
    expect(text).toContain(`per page per day, for ${VISIT_KEEP_DAYS} days:`)
    expect(text).toContain(`for ${SIGN_IN_LOCK_MINUTES} minutes, to stop guessing.`)
    expect(text).toContain(`expire after ${CODE_LIFETIME_MINUTES} minutes.`)
  })

  it('still says what the live site has always said', async () => {
    const text = await privacyPageText()
    expect(text).toContain('for 90 days:')
    expect(text).toContain('for 15 minutes, to stop guessing.')
    expect(text).toContain('expire after 10 minutes.')
  })
})
