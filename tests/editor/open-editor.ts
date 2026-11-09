/**
 * The editor page for tests: Mara's site from the example content, mounted
 * with a router, and each test starting without the draft backup an earlier
 * one left (src/editor/draftBackup.ts).
 */
import { afterEach, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createHead } from '@unhead/vue/client'
import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from '@/router'
import EditView from '@/views/EditView.vue'
import { demoContent } from '@shared/demo-content'
import { fakeApi, json } from '../fake-api'

export function startEachTestFresh() {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.unstubAllGlobals())
}

export async function openEditor() {
  fakeApi({
    'GET /api/me': json({ email: 'mara@example.com', site: { name: 'mara' } }),
    'GET /api/me/content': json({ ...demoContent, updatedAt: 'saved' }),
  })
  const router = createAppRouter(createMemoryHistory())
  await router.push('/mara/edit')
  const wrapper = mount(EditView, {
    props: { site: 'mara' },
    global: { plugins: [router, createHead()] },
    attachTo: document.body,
  })
  await flushPromises()
  return wrapper
}
export type Editor = Awaited<ReturnType<typeof openEditor>>

/** Clicks the first button whose text starts with `text`. */
export async function clickButton(editor: Editor, text: string) {
  await editor
    .findAll('button')
    .find((button) => button.text().startsWith(text))!
    .trigger('click')
}
