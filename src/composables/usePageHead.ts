import { useHead } from '@unhead/vue'
import { useSiteContent } from '@/content/useSiteContent'

/**
 * A page's title and description, for the browser tab and for link
 * previews: "Books · Mara Ellison". The front page has no page title.
 */
export function usePageHead(pageTitle: () => string | undefined) {
  const { content } = useSiteContent()
  useHead(() => {
    const { name, bioShort } = content.value.author
    const shownTitle = pageTitle()
    const title = shownTitle ? `${shownTitle} · ${name}` : name
    return {
      title,
      meta: [
        { name: 'description', content: bioShort },
        { property: 'og:title', content: title },
        { property: 'og:description', content: bioShort },
        { property: 'og:type', content: 'website' },
      ],
    }
  })
}
