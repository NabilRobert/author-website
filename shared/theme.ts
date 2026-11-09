/**
 * The site's look, chosen by the owner: page colours, link and button
 * colours, and the heading and body fonts.
 *
 * Fonts come from a short list of self-hosted fonts (no third-party font
 * requests); the site loads only the ones in use (src/styles/fonts.ts).
 */
import { z } from 'zod'

/** The fonts on offer: what the editor calls each, and its CSS stack. */
export const FONTS = {
  fraunces: { name: 'Fraunces (warm serif)', stack: "'Fraunces Variable', Georgia, serif" },
  lora: { name: 'Lora (book serif)', stack: "'Lora Variable', Georgia, serif" },
  'eb-garamond': { name: 'EB Garamond (classic serif)', stack: "'EB Garamond Variable', Garamond, serif" },
  'playfair-display': { name: 'Playfair Display (elegant headings)', stack: "'Playfair Display Variable', serif" },
  inter: { name: 'Inter (clean sans-serif)', stack: "'Inter Variable', system-ui, sans-serif" },
  'dm-sans': { name: 'DM Sans (friendly sans-serif)', stack: "'DM Sans Variable', system-ui, sans-serif" },
} as const

export type FontKey = keyof typeof FONTS
const fontKey = z.enum(Object.keys(FONTS) as [FontKey, ...FontKey[]])

export const colour = z.string().regex(/^#[0-9a-f]{6}$/i, 'Pick a colour.')
/** A colour, or '' for "use the site's colours". */
export const optionalColour = z.union([z.literal(''), colour])

export const themeSchema = z.object({
  backgroundColour: colour,
  textColour: colour,
  // Links, series names and other small highlights.
  accentColour: colour,
  buttonColour: colour,
  buttonTextColour: colour,
  headingFont: fontKey,
  bodyFont: fontKey,
})

export type Theme = z.infer<typeof themeSchema>

/** Warm paper, ink and oxblood, like a printed book. */
export const DEFAULT_THEME: Theme = {
  backgroundColour: '#f7f2e8',
  textColour: '#1f1b16',
  accentColour: '#7c2622',
  buttonColour: '#7c2622',
  buttonTextColour: '#fbf7ef',
  headingFont: 'fraunces',
  bodyFont: 'fraunces',
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
