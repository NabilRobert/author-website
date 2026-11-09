/**
 * The site's background as CSS variables: one of the patterns, or the
 * owner's picture. Patterns are CSS gradients painted in the owner's
 * pattern colours (shared/theme.ts: PATTERN_COLOUR_ROLES); a colour left
 * automatic is a faint mix of the text colour, so it suits any theme. The
 * `site-background` and `site-panel` utilities (src/styles/theme.css) read
 * these variables.
 */
import { PATTERN_BASE_COLOUR } from '@shared/theme'
import type { BackgroundPattern, Theme } from '@shared/theme'
import { imageUrl } from '@/content/format'

interface PatternLayers {
  image: string
  size: string
  position?: string
}

/** The pattern's colours 1 to 3, already resolved to CSS colours. */
type Paints = [string, string, string]

const PATTERNS: Record<Exclude<BackgroundPattern, 'none'>, (paint: Paints) => PatternLayers> = {
  // Two grids of dots, the second offset into the gaps of the first.
  dots: ([dots, between]) => ({
    image: `radial-gradient(${dots} 1.3px, transparent 1.8px), radial-gradient(${between} 1.3px, transparent 1.8px)`,
    size: '18px 18px',
    position: '0 0, 9px 9px',
  }),
  grid: ([main, fine]) => ({
    image: [
      `linear-gradient(${main} 1px, transparent 1px)`,
      `linear-gradient(90deg, ${main} 1px, transparent 1px)`,
      `linear-gradient(${fine} 1px, transparent 1px)`,
      `linear-gradient(90deg, ${fine} 1px, transparent 1px)`,
    ].join(', '),
    size: '96px 96px, 96px 96px, 24px 24px, 24px 24px',
  }),
  stripes: ([stripes, between]) => ({
    image: `repeating-linear-gradient(45deg, ${stripes} 0 1px, transparent 1px 12px, ${between} 12px 13px, transparent 13px 24px)`,
    size: 'auto',
  }),
  // Diamonds in two colours, crossed by thin lines.
  argyle: ([diamonds, otherDiamonds, lines]) => ({
    image: [
      `repeating-linear-gradient(120deg, ${lines} 0 1px, transparent 1px 60px)`,
      `repeating-linear-gradient(60deg, ${lines} 0 1px, transparent 1px 60px)`,
      `linear-gradient(60deg, ${diamonds} 25%, transparent 25% 75%, ${diamonds} 75%)`,
      `linear-gradient(120deg, ${diamonds} 25%, transparent 25% 75%, ${diamonds} 75%)`,
      `linear-gradient(${otherDiamonds}, ${otherDiamonds})`,
    ].join(', '),
    size: '70px 120px',
  }),
  linen: ([across, down]) => ({
    image: `repeating-linear-gradient(0deg, ${across} 0 1px, transparent 1px 4px), repeating-linear-gradient(90deg, ${down} 0 1px, transparent 1px 4px)`,
    size: 'auto',
  }),
}

const NO_BACKGROUND = {
  '--site-background-image': 'none',
  '--site-background-size': 'auto',
  '--site-background-position': 'center',
  '--site-pattern-base': 'transparent',
  '--site-panel-background': 'transparent',
  '--site-panel-inset': '0px',
}

// Automatic colours: the first faint, the others fainter still; the
// "other diamonds" of argyle stay clear so the page shows through.
const AUTOMATIC_SHARES = [9, 6, 6]
const CLEAR_BY_DEFAULT: Partial<Record<BackgroundPattern, number[]>> = { argyle: [1] }

export function backgroundVariables(theme: Theme): Record<string, string> {
  if (theme.backgroundImageKey) return pictureVariables(theme, theme.backgroundImageKey)
  if (theme.backgroundPattern === 'none') return NO_BACKGROUND
  const { image, size, position } = PATTERNS[theme.backgroundPattern](resolvePaints(theme))
  return {
    ...NO_BACKGROUND,
    '--site-background-image': image,
    '--site-background-size': size,
    '--site-background-position': position ?? 'center',
    '--site-pattern-base': theme.patternColours[PATTERN_BASE_COLOUR] || 'transparent',
  }
}

function resolvePaints(theme: Theme): Paints {
  const clear = CLEAR_BY_DEFAULT[theme.backgroundPattern] ?? []
  const automatic = (index: number) =>
    clear.includes(index)
      ? 'transparent'
      : `color-mix(in srgb, ${theme.textColour} ${AUTOMATIC_SHARES[index]}%, transparent)`
  const paint = (index: number) => theme.patternColours[index] || automatic(index)
  return [paint(0), paint(1), paint(2)]
}

// A light panel behind the content, set in from the edges so the picture
// frames it, keeps text readable on any picture.
function pictureVariables(theme: Theme, key: string): Record<string, string> {
  return {
    ...NO_BACKGROUND,
    '--site-background-image': `url("${imageUrl(key)}")`,
    '--site-background-size': 'cover',
    '--site-panel-background': `color-mix(in srgb, ${theme.backgroundColour} 93%, transparent)`,
    '--site-panel-inset': 'clamp(0.75rem, 4cqw, 3rem)',
  }
}
