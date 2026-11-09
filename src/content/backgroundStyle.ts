/**
 * The site's background as CSS variables: one of the patterns, or the
 * owner's picture. Patterns are made of CSS gradients in the theme's text
 * colour, mixed with transparency so they stay faint behind any text.
 * The `site-background` and `site-panel` utilities (src/styles/theme.css)
 * read these variables.
 */
import type { BackgroundPattern, Theme } from '@shared/theme'
import { imageUrl } from '@/content/format'

interface PatternLayers {
  image: string
  size: string
}

// `ink` is the faint pattern colour, `soft` an even fainter one.
const PATTERNS: Record<Exclude<BackgroundPattern, 'none'>, (ink: string, soft: string) => PatternLayers> = {
  dots: (ink) => ({ image: `radial-gradient(${ink} 1.3px, transparent 1.8px)`, size: '18px 18px' }),
  grid: (_ink, soft) => ({
    image: `linear-gradient(${soft} 1px, transparent 1px), linear-gradient(90deg, ${soft} 1px, transparent 1px)`,
    size: '24px 24px',
  }),
  stripes: (_ink, soft) => ({
    image: `repeating-linear-gradient(45deg, ${soft} 0 1px, transparent 1px 12px)`,
    size: 'auto',
  }),
  // Diamonds in two shades, crossed by thin lines.
  argyle: (ink, soft) => ({
    image: [
      `repeating-linear-gradient(120deg, ${soft} 0 1px, transparent 1px 60px)`,
      `repeating-linear-gradient(60deg, ${soft} 0 1px, transparent 1px 60px)`,
      `linear-gradient(60deg, ${ink} 25%, transparent 25% 75%, ${ink} 75%)`,
      `linear-gradient(120deg, ${ink} 25%, transparent 25% 75%, ${ink} 75%)`,
    ].join(', '),
    size: '70px 120px',
  }),
  linen: (_ink, soft) => ({
    image: `repeating-linear-gradient(0deg, ${soft} 0 1px, transparent 1px 4px), repeating-linear-gradient(90deg, ${soft} 0 1px, transparent 1px 4px)`,
    size: 'auto',
  }),
}

const NO_BACKGROUND = {
  '--site-background-image': 'none',
  '--site-background-size': 'auto',
  '--site-panel-background': 'transparent',
  '--site-panel-inset': '0px',
}

export function backgroundVariables(theme: Theme): Record<string, string> {
  if (theme.backgroundImageKey) {
    return {
      '--site-background-image': `url("${imageUrl(theme.backgroundImageKey)}")`,
      '--site-background-size': 'cover',
      // A light panel behind the content, set in from the edges so the
      // picture frames it, keeps text readable on any picture.
      '--site-panel-background': `color-mix(in srgb, ${theme.backgroundColour} 93%, transparent)`,
      '--site-panel-inset': 'clamp(0.75rem, 4cqw, 3rem)',
    }
  }
  if (theme.backgroundPattern === 'none') return NO_BACKGROUND
  const mix = (share: number) => `color-mix(in srgb, ${theme.textColour} ${share}%, transparent)`
  const { image, size } = PATTERNS[theme.backgroundPattern](mix(9), mix(6))
  return { ...NO_BACKGROUND, '--site-background-image': image, '--site-background-size': size }
}
