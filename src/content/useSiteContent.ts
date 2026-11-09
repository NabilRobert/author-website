/**
 * The site's content, loaded once from the API (GET /api/content) and
 * shared by every page. The app shows the pages only once it has loaded,
 * so components below it can use `useSiteContent()` without null checks.
 */
import { computed, ref, shallowRef } from 'vue'
import type { SiteContent } from '@shared/schema'

/** Where loading stands: the app shows a message for each state but 'ready'. */
export type LoadStatus = 'loading' | 'ready' | 'not-set-up' | 'failed'

const loadedContent = shallowRef<SiteContent | null>(null)
const status = ref<LoadStatus>('loading')

export async function loadSiteContent(): Promise<void> {
  status.value = 'loading'
  try {
    const response = await fetch('/api/content')
    if (response.status === 404) {
      status.value = 'not-set-up'
      return
    }
    if (!response.ok) throw new Error(`GET /api/content answered ${response.status}`)
    loadedContent.value = (await response.json()) as SiteContent
    status.value = 'ready'
  } catch (error) {
    console.error(error)
    status.value = 'failed'
  }
}

export function useLoadStatus() {
  return { status, loadedContent }
}

/** The loaded content. Only for components shown once loading is done. */
export function useSiteContent() {
  const content = computed(() => {
    if (!loadedContent.value) throw new Error('useSiteContent() was used before the content loaded.')
    return loadedContent.value
  })
  return { content }
}
