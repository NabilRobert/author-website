import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { contrastRatio, DEFAULT_THEME, themeSchema } from '@shared/theme'
import { themeVariables } from '@/content/themeVariables'
import HeroBlock from '@/components/blocks/HeroBlock.vue'
import type { BlockOf } from '@shared/blocks'

describe('contrastRatio', () => {
  it('is 21 for black on white and 1 for a colour on itself', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21)
    expect(contrastRatio('#7c2622', '#7c2622')).toBe(1)
  })

  it('finds the default text readable on the default background', () => {
    expect(contrastRatio(DEFAULT_THEME.textColour, DEFAULT_THEME.backgroundColour)).toBeGreaterThan(4.5)
  })
})

describe('theme schema', () => {
  it('rejects a colour that is not a hex code, such as one meant to inject CSS', () => {
    const theme = { ...DEFAULT_THEME, accentColour: 'red; background: url(https://evil.example)' }
    expect(themeSchema.safeParse(theme).success).toBe(false)
  })

  it('rejects a font that is not on offer', () => {
    expect(themeSchema.safeParse({ ...DEFAULT_THEME, bodyFont: 'comic-sans' }).success).toBe(false)
  })
})

describe('themeVariables', () => {
  it('maps the owner colours and fonts to the CSS variables the styles use', () => {
    const variables = themeVariables({ ...DEFAULT_THEME, accentColour: '#004488', headingFont: 'inter' })
    expect(variables['--color-accent']).toBe('#004488')
    expect(variables['--font-heading']).toContain('Inter Variable')
    expect(variables['--color-muted']).toBe('color-mix(in srgb, #1f1b16 72%, #f7f2e8)')
  })
})

describe('HeroBlock', () => {
  const hero: BlockOf<'hero'> = {
    id: crypto.randomUUID(),
    type: 'hero',
    heading: 'Welcome',
    subheading: '',
    imageKey: null,
    buttonLabel: '',
    buttonUrl: '',
    backgroundColour: '#123456',
    textColour: '#fefefe',
  }

  it('uses the banner own colours when the owner picked them', async () => {
    const wrapper = mount(HeroBlock, { props: { block: hero, isPageTitle: true } })
    await flushPromises()
    const style = wrapper.find('section').attributes('style')
    expect(style).toContain('background-color: rgb(18, 52, 86)')
    expect(style).toContain('color: rgb(254, 254, 254)')
  })

  it('makes its heading the page title only at the top of a page', () => {
    expect(
      mount(HeroBlock, { props: { block: hero, isPageTitle: true } })
        .find('h1')
        .exists(),
    ).toBe(true)
    expect(
      mount(HeroBlock, { props: { block: hero, isPageTitle: false } })
        .find('h1')
        .exists(),
    ).toBe(false)
  })
})
