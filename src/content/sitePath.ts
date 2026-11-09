/**
 * Links inside someone's site. The owner writes them as "/books"; on
 * Framed that page lives at "/<name>/books". SiteLayout provides the
 * site's name; components turn their links into full paths with
 * `useSitePath()`. Outside a site (tests, the landing page) paths are
 * left as they are.
 */
import { inject, provide } from 'vue'
import type { InjectionKey } from 'vue'

const SITE_NAME: InjectionKey<string> = Symbol('site name')

export function provideSiteName(name: string): void {
  provide(SITE_NAME, name)
}

/** "/books" → "/mara/books", "/" → "/mara"; other links are unchanged. */
export function useSitePath(): (path: string) => string {
  const name = inject(SITE_NAME, '')
  return (path: string) => {
    if (!name || !path.startsWith('/')) return path
    return path === '/' ? `/${name}` : `/${name}${path}`
  }
}
