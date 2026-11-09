/**
 * Counts a view of a site's page (POST /api/sites/<name>/visits,
 * server/visits.ts) once it is shown. The site's own owner isn't counted,
 * so it waits until it knows who is logged in; the editor's preview has no
 * site name and never counts. Sent as plain text with keepalive, so it
 * needs no permission check first and still goes if the visitor leaves at
 * once. A failure is ignored: a missed count must never trouble a visitor.
 */
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAccount } from '@/auth/useAccount'
import { useSiteName } from '@/content/sitePath'

export function useCountVisit(isFound: () => boolean): void {
  const route = useRoute()
  const siteName = useSiteName()
  const { isKnown, ownSite } = useAccount()
  let lastCounted = ''

  watch(
    () => [route.path, isFound(), isKnown.value] as const,
    ([routePath, found, known]) => {
      if (!siteName || !found || !known || ownSite.value === siteName || routePath === lastCounted) return
      lastCounted = routePath
      const path = routePath.slice(siteName.length + 1) || '/'
      void fetch(`/api/sites/${siteName}/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ path }),
        keepalive: true,
      }).catch(() => undefined)
    },
    { immediate: true },
  )
}
