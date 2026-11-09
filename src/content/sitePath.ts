/**
 * Links inside someone's site. The owner writes them as "/works"; on
 * Framed that page lives at "/<name>/works". SiteLayout provides the
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

/** The name of the site being shown, or '' outside one (the editor's preview). */
export function useSiteName(): string {
  return inject(SITE_NAME, '')
}

/** "/work" → "/alex/work", "/" → "/alex"; other links are unchanged. */
export function useSitePath(): (path: string) => string {
  const name = inject(SITE_NAME, '')
  return (path: string) => {
    if (!name || !path.startsWith('/')) return path
    return path === '/' ? `/${name}` : `/${name}${path}`
  }
}
