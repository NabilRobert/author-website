/**
 * The site's content, shared by every page. For now it is the demo
 * document; the content-API slice replaces this with a fetch.
 */
import { shallowRef } from 'vue'
import { demoContent } from '@shared/demo-content'
import type { SiteContent } from '@shared/schema'

const content = shallowRef<SiteContent>(demoContent)

export function useSiteContent() {
  return { content }
}
