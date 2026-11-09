import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { reactive } from 'vue'
import { BACKGROUND_PATTERNS, DEFAULT_THEME, themeSchema } from '@shared/theme'
import type { BackgroundPattern, Theme } from '@shared/theme'
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

describe('pattern colours', () => {
  it('paints the pattern in the owner colours and keeps automatic ones faint', () => {
    const theme = { ...DEFAULT_THEME, backgroundPattern: 'argyle' as const }
    const variables = backgroundVariables({ ...theme, patternColours: ['#aa0000', '', '#0000aa', '#fafafa'] })
    expect(variables['--site-background-image']).toContain('#aa0000')
    expect(variables['--site-background-image']).toContain('#0000aa')
    expect(variables['--site-pattern-base']).toBe('#fafafa')
  })

  it('shows the page background behind the pattern unless a colour is picked', () => {
    const variables = backgroundVariables({ ...DEFAULT_THEME, backgroundPattern: 'dots' })
    expect(variables['--site-pattern-base']).toBe('transparent')
  })
})

describe('PatternField', () => {
  function mountField(pattern: BackgroundPattern) {
    const theme = reactive<Theme>({ ...DEFAULT_THEME, backgroundPattern: pattern, patternColours: ['', '', '', ''] })
    const field = mount(PatternField, { props: { modelValue: theme } })
    return { theme, field }
  }

  it('offers each pattern as a tile and picks the one clicked', async () => {
    const { theme, field } = mountField('none')
    expect(field.findAll('input[type="radio"]')).toHaveLength(6)
    await field.find('input[value="argyle"]').setValue()
    expect(theme.backgroundPattern).toBe('argyle')
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
