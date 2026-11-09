/**
 * Loads the theme's fonts on demand, so visitors download only the one or
 * two fonts the site uses, not all six on offer.
 */
import type { FontKey } from '@shared/theme'

const FONT_LOADERS: Record<FontKey, () => Promise<unknown>> = {
  fraunces: () => import('@fontsource-variable/fraunces'),
  lora: () => import('@fontsource-variable/lora'),
  'eb-garamond': () => import('@fontsource-variable/eb-garamond'),
  'playfair-display': () => import('@fontsource-variable/playfair-display'),
  inter: () => import('@fontsource-variable/inter'),
  'dm-sans': () => import('@fontsource-variable/dm-sans'),
}

const loaded = new Set<FontKey>()

export function loadFonts(fonts: FontKey[]): void {
  for (const font of fonts) {
    if (loaded.has(font)) continue
    loaded.add(font)
    void FONT_LOADERS[font]()
  }
}
