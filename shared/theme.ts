/**
 * The site's look, chosen by the owner: page colours, link and button
 * colours, and the heading and body fonts.
 *
 * Fonts come from a short list of self-hosted fonts (no third-party font
 * requests); the site loads only the ones in use (src/styles/fonts.ts).
 */
import { z } from 'zod'
import { imageKey } from './fields'

/** The fonts on offer: what the editor calls each, and its CSS stack. */
export const FONTS = {
  fraunces: { name: 'Fraunces (warm serif)', stack: "'Fraunces Variable', Georgia, serif" },
  lora: { name: 'Lora (work serif)', stack: "'Lora Variable', Georgia, serif" },
  'eb-garamond': { name: 'EB Garamond (classic serif)', stack: "'EB Garamond Variable', Garamond, serif" },
  'playfair-display': { name: 'Playfair Display (elegant headings)', stack: "'Playfair Display Variable', serif" },
  inter: { name: 'Inter (clean sans-serif)', stack: "'Inter Variable', system-ui, sans-serif" },
  'dm-sans': { name: 'DM Sans (friendly sans-serif)', stack: "'DM Sans Variable', system-ui, sans-serif" },
} as const

export type FontKey = keyof typeof FONTS

/**
 * Background patterns, drawn in CSS from the theme's text colour at low
 * strength (src/content/backgroundStyle.ts), so they suit any colours.
 */
export const BACKGROUND_PATTERNS = {
  none: 'Plain',
  dots: 'Dots',
  grid: 'Graph paper',
  stripes: 'Pinstripes',
  argyle: 'Argyle',
  linen: 'Linen',
} as const

export type BackgroundPattern = keyof typeof BACKGROUND_PATTERNS

/**
 * What each of a pattern's colours paints, in the order of
 * `patternColours`. The fourth colour is always what shows behind the
 * pattern. An empty colour means automatic: a faint mix of the text colour
 * (or, behind the pattern, the page background).
 */
export const PATTERN_COLOUR_ROLES: Record<BackgroundPattern, string[]> = {
  none: [],
  dots: ['Dots', 'In-between dots'],
  grid: ['Main lines', 'Fine lines'],
  stripes: ['Stripes', 'In-between stripes'],
  argyle: ['Diamonds', 'Other diamonds', 'Lines'],
  linen: ['Across threads', 'Down threads'],
}
export const PATTERN_BASE_COLOUR = 3

/**
 * The shape of pictures of work: portrait suits books and posters,
 * landscape buildings and design, square art, wide apps and video.
 */
export const WORK_SHAPES = {
  portrait: 'Portrait (books, posters)',
  landscape: 'Landscape (buildings, design, photos)',
  square: 'Square (art, products)',
  wide: 'Wide (apps, websites, video)',
} as const

export type WorkShape = keyof typeof WORK_SHAPES
const fontKey = z.enum(Object.keys(FONTS) as [FontKey, ...FontKey[]])

export const colour = z.string().regex(/^#[0-9a-f]{6}$/i, 'Pick a colour.')
/** A colour, or '' for "use the site's colours". */
export const optionalColour = z.union([z.literal(''), colour])

const patternSchema = z.enum(Object.keys(BACKGROUND_PATTERNS) as [BackgroundPattern, ...BackgroundPattern[]])

/** Four pattern colours (see PATTERN_COLOUR_ROLES); '' means automatic. */
export type PatternColours = [string, string, string, string]
const noPatternColours = (): PatternColours => ['', '', '', '']
const patternColoursSchema = z.tuple([optionalColour, optionalColour, optionalColour, optionalColour])

export const CORNERS = { rounded: 'Rounded', sharp: 'Sharp' } as const
export type Corners = keyof typeof CORNERS
const cornersSchema = z.enum(Object.keys(CORNERS) as [Corners, ...Corners[]])
const OPACITY_RANGE = 'Opacity is between 0 and 100.'
const opacitySchema = z.number().int().min(0, OPACITY_RANGE).max(100, OPACITY_RANGE)

/**
 * A box around any block: its own fill colour and pattern, how see-through
 * that fill is (the text stays solid), its text colour and its corners.
 * The plain style (no fill, no pattern) draws no box at all.
 */
export const boxStyleSchema = z.object({
  background: optionalColour,
  text: optionalColour,
  opacity: opacitySchema,
  corners: cornersSchema,
  pattern: patternSchema,
  patternColours: patternColoursSchema,
})
export type BoxStyle = z.infer<typeof boxStyleSchema>
export const plainBox = (): BoxStyle => ({
  background: '',
  text: '',
  opacity: 100,
  corners: 'rounded',
  pattern: 'none',
  patternColours: noPatternColours(),
})

export const PANEL_WIDTHS = { framed: 'Framed, with the background around it', full: 'All the way across' } as const
export type PanelWidth = keyof typeof PANEL_WIDTHS

/**
 * The content box over a background picture or a strong pattern: its colour
 * ('' = the page background), how see-through it is, its corners, and
 * whether it is framed by the background or spans the whole width.
 */
export const panelSchema = z.object({
  colour: optionalColour,
  opacity: opacitySchema,
  corners: cornersSchema,
  width: z.enum(Object.keys(PANEL_WIDTHS) as [PanelWidth, ...PanelWidth[]]),
})
export type Panel = z.infer<typeof panelSchema>
export const DEFAULT_PANEL: Panel = { colour: '', opacity: 93, corners: 'rounded', width: 'framed' }

export const themeSchema = z.object({
  backgroundColour: colour,
  textColour: colour,
  // Links, series names and other small highlights.
  accentColour: colour,
  buttonColour: colour,
  buttonTextColour: colour,
  headingFont: fontKey,
  bodyFont: fontKey,
  // Added after the first saves, hence the defaults.
  backgroundPattern: patternSchema.default('none'),
  patternColours: patternColoursSchema.default(noPatternColours),
  workShape: z.enum(Object.keys(WORK_SHAPES) as [WorkShape, ...WorkShape[]]).default('landscape'),
  // A picture behind the whole site; it replaces the pattern.
  backgroundImageKey: imageKey.default(null),
  panel: panelSchema.default(() => ({ ...DEFAULT_PANEL })),
})

export type Theme = z.infer<typeof themeSchema>

/** Warm paper, ink and oxblood, like a printed work. */
export const DEFAULT_THEME: Theme = {
  backgroundColour: '#f7f2e8',
  textColour: '#1f1b16',
  accentColour: '#7c2622',
  buttonColour: '#7c2622',
  buttonTextColour: '#fbf7ef',
  headingFont: 'fraunces',
  bodyFont: 'fraunces',
  backgroundPattern: 'none',
  patternColours: ['', '', '', ''],
  workShape: 'landscape',
  backgroundImageKey: null,
  panel: DEFAULT_PANEL,
}

/** WCAG's minimum contrast for body text; the editor warns below it. */
export const MIN_READABLE_CONTRAST = 4.5

/** How readable one colour is on another, from 1 (none) to 21 (black on white). */
export function contrastRatio(first: string, second: string): number {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a) as [number, number]
  return (lighter + 0.05) / (darker + 0.05)
}

// Relative luminance, as WCAG 2 defines it.
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255)
  const [red, green, blue] = channels.map((value) =>
    value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  ) as [number, number, number]
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}
