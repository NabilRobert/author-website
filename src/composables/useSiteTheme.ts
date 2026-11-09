import { watchEffect } from 'vue'
import { useSiteContent } from '@/content/useSiteContent'
import { themeVariables } from '@/content/themeVariables'
import { loadFonts } from '@/styles/fonts'

/** Applies the owner's colours and fonts to the whole page, and keeps them current. */
export function useSiteTheme(): void {
  const { content } = useSiteContent()
  watchEffect(() => {
    const { theme } = content.value
    loadFonts([theme.headingFont, theme.bodyFont])
    for (const [name, value] of Object.entries(themeVariables(theme))) {
      document.documentElement.style.setProperty(name, value)
    }
  })
}
