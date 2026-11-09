/**
 * The site's background as CSS variables: one of the patterns, or the
 * owner's picture. Patterns are CSS gradients painted in the owner's
 * pattern colours (shared/theme.ts: PATTERN_COLOUR_ROLES); a colour left
 * automatic is a faint mix of the text colour, so it suits any theme. The
 * `site-background` and `site-panel` utilities (src/styles/theme.css) read
 * these variables.
 */
import { PATTERN_BASE_COLOUR } from '@shared/theme'
import type { BackgroundPattern, BoxStyle, PatternColours, Theme } from '@shared/theme'
import { imageUrl } from '@/content/format'

/**
 * One layer of a pattern. Every layer carries its own size: CSS reuses a
 * shorter size list for the remaining layers, which once drew argyle's
 * diamonds as page-sized triangles.
 */
interface Layer {
  image: string
  size: string
  position?: string
}

/** The pattern's colours 1 to 3, already resolved to CSS colours. */
type Paints = [string, string, string]

const PATTERNS: Record<Exclude<BackgroundPattern, 'none'>, (paint: Paints) => Layer[]> = {
  // Two grids of dots, the second offset into the gaps of the first.
  dots: ([dots, between]) => [
    { image: `radial-gradient(${dots} 1.3px, transparent 1.8px)`, size: '18px 18px', position: '0 0' },
    { image: `radial-gradient(${between} 1.3px, transparent 1.8px)`, size: '18px 18px', position: '9px 9px' },
  ],
  grid: ([main, fine]) => [
    { image: `linear-gradient(${main} 1px, transparent 1px)`, size: '96px 96px' },
    { image: `linear-gradient(90deg, ${main} 1px, transparent 1px)`, size: '96px 96px' },
    { image: `linear-gradient(${fine} 1px, transparent 1px)`, size: '24px 24px' },
    { image: `linear-gradient(90deg, ${fine} 1px, transparent 1px)`, size: '24px 24px' },
  ],
  stripes: ([stripes, between]) => [
    {
      image: `repeating-linear-gradient(45deg, ${stripes} 0 1px, transparent 1px 12px, ${between} 12px 13px, transparent 13px 24px)`,
      size: 'auto',
    },
  ],
  // Diamonds in two colours, crossed by thin lines (a classic CSS argyle).
  argyle: ([diamonds, otherDiamonds, lines]) => [
    { image: `repeating-linear-gradient(120deg, ${lines} 0 1px, transparent 1px 60px)`, size: '70px 120px' },
    { image: `repeating-linear-gradient(60deg, ${lines} 0 1px, transparent 1px 60px)`, size: '70px 120px' },
    {
      image: `linear-gradient(60deg, ${diamonds} 25%, transparent 25% 75%, ${diamonds} 75%)`,
      size: '70px 120px',
    },
    {
      image: `linear-gradient(120deg, ${diamonds} 25%, transparent 25% 75%, ${diamonds} 75%)`,
      size: '70px 120px',
    },
    { image: `linear-gradient(${otherDiamonds}, ${otherDiamonds})`, size: 'auto' },
  ],
  linen: ([across, down]) => [
    { image: `repeating-linear-gradient(0deg, ${across} 0 1px, transparent 1px 4px)`, size: 'auto' },
    { image: `repeating-linear-gradient(90deg, ${down} 0 1px, transparent 1px 4px)`, size: 'auto' },
  ],
}

const NO_BACKGROUND = {
  '--site-background-image': 'none',
  '--site-background-size': 'auto',
  '--site-background-position': 'center',
  '--site-pattern-base': 'transparent',
  '--site-panel-background': 'transparent',
  '--site-panel-inset-x': '0px',
  '--site-panel-inset-y': '0px',
  '--site-panel-max': '76rem',
  '--site-panel-radius': '0px',
}

// Automatic colours: the first faint, the others fainter still; the
// "other diamonds" of argyle stay clear so the page shows through.
const AUTOMATIC_SHARES = [9, 6, 6]
const CLEAR_BY_DEFAULT: Partial<Record<BackgroundPattern, number[]>> = { argyle: [1] }
const ROUNDED_RADIUS = '1.5rem'
// The gap between the content box and the edges of the page.
const PANEL_GAP = 'clamp(0.75rem, 4cqw, 3rem)'

/** A pattern's layers as three CSS values (image, size, position). */
export function patternCss(pattern: BackgroundPattern, paints: Paints) {
  if (pattern === 'none') return { image: 'none', size: 'auto', position: 'center' }
  const layers = PATTERNS[pattern](paints)
  return {
    image: layers.map((layer) => layer.image).join(', '),
    size: layers.map((layer) => layer.size).join(', '),
    position: layers.map((layer) => layer.position ?? 'center').join(', '),
  }
}

/**
 * The pattern's three paint colours: the owner's, or automatic ones mixed
 * from `ink` (a colour, or "currentColor" to follow the text).
 */
export function resolvePaints(pattern: BackgroundPattern, colours: PatternColours, ink: string): Paints {
  const clear = CLEAR_BY_DEFAULT[pattern] ?? []
  const automatic = (index: number) =>
    clear.includes(index) ? 'transparent' : `color-mix(in srgb, ${ink} ${AUTOMATIC_SHARES[index]}%, transparent)`
  const paint = (index: number) => colours[index] || automatic(index)
  return [paint(0), paint(1), paint(2)]
}

export function backgroundVariables(theme: Theme): Record<string, string> {
  if (theme.backgroundImageKey) return pictureVariables(theme, theme.backgroundImageKey)
  if (theme.backgroundPattern === 'none') return NO_BACKGROUND
  const css = patternCss(
    theme.backgroundPattern,
    resolvePaints(theme.backgroundPattern, theme.patternColours, theme.textColour),
  )
  return {
    ...NO_BACKGROUND,
    '--site-background-image': css.image,
    '--site-background-size': css.size,
    '--site-background-position': css.position,
    '--site-pattern-base': theme.patternColours[PATTERN_BASE_COLOUR] || 'transparent',
    // Owner-picked pattern colours can be strong, so the content then sits on
    // the content box, as it does over a picture; faint automatic ones need none.
    ...(hasOwnColours(theme) ? panelVariables(theme) : {}),
  }
}

function hasOwnColours(theme: Theme): boolean {
  return theme.patternColours.slice(0, PATTERN_BASE_COLOUR).some(Boolean)
}

/**
 * The content box over the background, as the owner set it: its colour
 * ('' = the page background) at their opacity, framed by the background or
 * all the way across, with rounded or sharp corners.
 */
function panelVariables(theme: Theme): Record<string, string> {
  const { colour, opacity, corners, width } = theme.panel
  return {
    '--site-panel-background': `color-mix(in srgb, ${colour || theme.backgroundColour} ${opacity}%, transparent)`,
    // "All the way across" means edge to edge, left to right; the gap above
    // and below stays, as it does when framed.
    '--site-panel-inset-x': width === 'full' ? '0px' : PANEL_GAP,
    '--site-panel-inset-y': PANEL_GAP,
    '--site-panel-max': width === 'full' ? '100%' : '76rem',
    '--site-panel-radius': corners === 'sharp' ? '0px' : ROUNDED_RADIUS,
  }
}

// Any picture can sit behind the content, so it always gets the content box.
function pictureVariables(theme: Theme, key: string): Record<string, string> {
  return {
    ...NO_BACKGROUND,
    '--site-background-image': `url("${imageUrl(key)}")`,
    '--site-background-size': 'cover',
    ...panelVariables(theme),
  }
}

/** Whether a block's box has anything to draw (a fill colour or a pattern). */
export function hasBoxFill(style: BoxStyle): boolean {
  return Boolean(style.background) || style.pattern !== 'none'
}

/**
 * A block's box as CSS variables (the `box-fill` utility reads them). An
 * automatic pattern follows the box's text colour.
 */
export function boxVariables(style: BoxStyle): Record<string, string> {
  const css = patternCss(style.pattern, resolvePaints(style.pattern, style.patternColours, 'currentColor'))
  return {
    '--box-colour': style.background || 'transparent',
    '--box-image': css.image,
    '--box-size': css.size,
    '--box-position': css.position,
    '--box-opacity': String(style.opacity / 100),
    '--box-radius': style.corners === 'sharp' ? '0px' : ROUNDED_RADIUS,
    ...(style.text ? boxTextVariables(style.text) : {}),
    ...(style.button ? { '--color-button': style.button } : {}),
    ...(style.buttonText ? { '--color-button-text': style.buttonText } : {}),
  }
}

/**
 * A box's own text colour, and the colours drawn from the site's text
 * colour (muted lines, rules, links) re-mixed from it, so nothing inside
 * the box keeps a colour meant for the page behind it.
 */
function boxTextVariables(text: string): Record<string, string> {
  return {
    '--box-text': text,
    '--color-ink': text,
    '--color-muted': `color-mix(in srgb, ${text} 75%, transparent)`,
    '--color-line': `color-mix(in srgb, ${text} 25%, transparent)`,
    '--color-accent': text,
  }
}
