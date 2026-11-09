/**
 * Turns the owner's theme into the CSS variables the styles use
 * (src/styles/theme.css). The public site sets them on the whole page; the
 * editor's preview sets them on the preview box only.
 *
 * The muted text, rule and panel colours are mixed from the text and
 * background colours here, not in CSS, because a variable set on an element
 * does not recompute mixes declared higher up.
 */
import { FONTS } from '@shared/theme'
import type { Theme } from '@shared/theme'
import { backgroundVariables } from '@/content/backgroundStyle'

export function themeVariables(theme: Theme): Record<string, string> {
  const mix = (textShare: number) => `color-mix(in srgb, ${theme.textColour} ${textShare}%, ${theme.backgroundColour})`
  return {
    '--color-paper': theme.backgroundColour,
    '--color-ink': theme.textColour,
    '--color-accent': theme.accentColour,
    '--color-button': theme.buttonColour,
    '--color-button-text': theme.buttonTextColour,
    '--color-muted': mix(72),
    '--color-line': mix(18),
    '--color-paper-deep': mix(6),
    '--font-heading': FONTS[theme.headingFont].stack,
    '--font-body': FONTS[theme.bodyFont].stack,
    ...backgroundVariables(theme),
  }
}
