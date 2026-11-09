/**
 * The content of the site being viewed, loaded from the API
 * (GET /api/sites/<name>/content) and shared by every page of that site.
 * SiteLayout shows the pages only once it has loaded, so components below
 * it can use `useSiteContent()` without null checks.
 */
import { computed, ref, shallowRef } from 'vue'
import type { SiteContent } from '@shared/schema'

/** Where loading stands: SiteLayout shows a message for each state but 'ready'. */
export type LoadStatus = 'loading' | 'ready' | 'not-set-up' | 'no-site' | 'failed'

const loadedContent = shallowRef<SiteContent | null>(null)
const status = ref<LoadStatus>('loading')

export async function loadSiteContent(siteName: string): Promise<void> {
  status.value = 'loading'
  loadedContent.value = null
  try {
    const response = await fetch(`/api/sites/${encodeURIComponent(siteName)}/content`)
    if (response.status === 404) {
      const body = (await response.json().catch(() => ({}))) as { reason?: string }
      status.value = body.reason === 'not-set-up' ? 'not-set-up' : 'no-site'
      return
    }
    if (!response.ok) throw new Error(`GET /api/sites/${siteName}/content answered ${response.status}`)
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
