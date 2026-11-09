import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { BACKGROUND_PATTERNS, DEFAULT_PANEL, DEFAULT_THEME, themeSchema } from '@shared/theme'
import type { BackgroundPattern, PatternColours } from '@shared/theme'
import { backgroundVariables } from '@/content/backgroundStyle'
import PatternField from '@/editor/fields/PatternField.vue'

const PATTERNS = Object.keys(BACKGROUND_PATTERNS).filter((key) => key !== 'none') as BackgroundPattern[]

describe('background patterns', () => {
  it.each(PATTERNS)('draws %s in a faint mix of the text colour', (pattern) => {
    const variables = backgroundVariables({ ...DEFAULT_THEME, textColour: '#123456', backgroundPattern: pattern })
    expect(variables['--site-background-image']).toContain('color-mix(in srgb, #123456')
    expect(variables['--site-panel-background']).toBe('transparent')
  })

  it('draws nothing for the plain background', () => {
    expect(backgroundVariables(DEFAULT_THEME)['--site-background-image']).toBe('none')
  })

  it('uses the picture instead of the pattern, with a light panel over it', () => {
    const variables = backgroundVariables({
      ...DEFAULT_THEME,
      backgroundPattern: 'argyle',
      backgroundImageKey: 'images/0b8e2f4c-3a1d-4c6b-8e7f-2d9a5c1b3e01.jpg',
    })
    expect(variables['--site-background-image']).toBe('url("/api/images/0b8e2f4c-3a1d-4c6b-8e7f-2d9a5c1b3e01.jpg")')
    expect(variables['--site-background-size']).toBe('cover')
    expect(variables['--site-panel-background']).toContain('93%')
  })
})

describe('theme schema backgrounds', () => {
  it('gives a theme saved before backgrounds existed a plain background', () => {
    const olderTheme: Record<string, unknown> = { ...DEFAULT_THEME }
    delete olderTheme.backgroundPattern
    delete olderTheme.backgroundImageKey
    expect(themeSchema.parse(olderTheme)).toMatchObject({ backgroundPattern: 'none', backgroundImageKey: null })
  })

  it('rejects a pattern that is not on offer', () => {
    expect(themeSchema.safeParse({ ...DEFAULT_THEME, backgroundPattern: 'tartan' }).success).toBe(false)
  })
})

describe('pattern layers', () => {
  // Counts top-level comma-separated layers; commas inside brackets
  // (a gradient's own arguments, color-mix(...)) don't separate layers.
  function layerCount(css: string): number {
    let depth = 0
    let layers = 1
    for (const character of css) {
      if (character === '(') depth++
      if (character === ')') depth--
      if (character === ',' && depth === 0) layers++
    }
    return layers
  }

  it.each(PATTERNS)('gives every layer of %s its own size and position', (pattern) => {
    const variables = backgroundVariables({ ...DEFAULT_THEME, backgroundPattern: pattern })
    const layers = layerCount(variables['--site-background-image']!)
    expect(layerCount(variables['--site-background-size']!)).toBe(layers)
    expect(layerCount(variables['--site-background-position']!)).toBe(layers)
  })
})

describe('pattern colours', () => {
  it('paints the pattern in the owner colours and keeps automatic ones faint', () => {
    const theme = { ...DEFAULT_THEME, backgroundPattern: 'argyle' as const }
    const variables = backgroundVariables({ ...theme, patternColours: ['#aa0000', '', '#0000aa', '#fafafa'] })
    expect(variables['--site-background-image']).toContain('#aa0000')
    expect(variables['--site-background-image']).toContain('#0000aa')
    expect(variables['--site-pattern-base']).toBe('#fafafa')
  })

  it('puts the content on a light panel once the owner picks a pattern colour', () => {
    const own = { ...DEFAULT_THEME, backgroundPattern: 'argyle' as const }
    const ownColours = backgroundVariables({ ...own, patternColours: ['#c0392b', '', '', ''] })
    expect(ownColours['--site-panel-background']).toContain('93%')
    expect(backgroundVariables(own)['--site-panel-background']).toBe('transparent')
  })

  it('shows the page background behind the pattern unless a colour is picked', () => {
    const variables = backgroundVariables({ ...DEFAULT_THEME, backgroundPattern: 'dots' })
    expect(variables['--site-pattern-base']).toBe('transparent')
  })
})

describe('PatternField', () => {
  function mountField(pattern: BackgroundPattern) {
    const picked = { pattern, colours: ['', '', '', ''] as PatternColours }
    const field = mount(PatternField, {
      props: {
        label: 'Background pattern',
        previewBackground: '#ffffff',
        previewInk: '#000000',
        behindName: 'the page background',
        pattern,
        colours: picked.colours,
        'onUpdate:pattern': (next: BackgroundPattern) => (picked.pattern = next),
      },
    })
    return { picked, field }
  }

  it('offers each pattern as a tile and picks the one clicked', async () => {
    const { picked, field } = mountField('none')
    expect(field.findAll('input[type="radio"]')).toHaveLength(6)
    await field.find('input[value="argyle"]').setValue()
    expect(picked.pattern).toBe('argyle')
  })

  it('asks for a colour per part of the pattern, plus what is behind it', () => {
    const { field } = mountField('argyle')
    const labels = field.findAll('fieldset label.block').map((label) => label.text())
    expect(labels).toEqual(['Diamonds', 'Other diamonds', 'Lines', 'Behind the pattern'])
  })

  it('asks for no pattern colours on a plain background', () => {
    const { field } = mountField('none')
    expect(field.text()).not.toContain('Pattern colours')
  })
})

describe('the content box', () => {
  const pictured = { ...DEFAULT_THEME, backgroundImageKey: 'images/0b8e2f4c-3a1d-4c6b-8e7f-2d9a5c1b3e01.jpg' }

  it("uses the owner's colour, opacity, corners and width", () => {
    const panel = { colour: '#112233', opacity: 60, corners: 'sharp' as const, width: 'full' as const }
    const variables = backgroundVariables({ ...pictured, panel })
    expect(variables['--site-panel-background']).toBe('color-mix(in srgb, #112233 60%, transparent)')
    expect(variables['--site-panel-inset']).toBe('0px')
    expect(variables['--site-panel-radius']).toBe('0px')
  })

  it('is framed and rounded by default', () => {
    const variables = backgroundVariables(pictured)
    expect(variables['--site-panel-inset']).not.toBe('0px')
    expect(variables['--site-panel-radius']).toBe('1.5rem')
  })

  it('gives a theme saved before content-box settings the default box', () => {
    const olderTheme: Record<string, unknown> = { ...DEFAULT_THEME }
    delete olderTheme.panel
    expect(themeSchema.parse(olderTheme).panel).toEqual(DEFAULT_PANEL)
  })
})
