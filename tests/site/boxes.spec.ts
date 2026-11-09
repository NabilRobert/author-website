import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BlockBox from '@/components/blocks/BlockBox.vue'
import { boxVariables } from '@/content/backgroundStyle'
import { blockSchema } from '@shared/blocks'
import { plainBox } from '@shared/theme'
import type { BoxStyle } from '@shared/theme'

function mountBox(style: Partial<BoxStyle>) {
  return mount(BlockBox, { props: { boxStyle: { ...plainBox(), ...style } }, slots: { default: '<p>Words</p>' } })
}

describe("a block's box", () => {
  it('draws nothing for the plain style', () => {
    const box = mountBox({})
    expect(box.find('.box-fill').exists()).toBe(false)
    expect(box.text()).toBe('Words')
  })

  it('fills with the colour at the chosen opacity, on its own layer', () => {
    const box = mountBox({ background: '#123456', opacity: 40 })
    expect(box.find('.box-fill').exists()).toBe(true)
    const style = box.attributes('style')
    expect(style).toContain('--box-colour: #123456')
    expect(style).toContain('--box-opacity: 0.4')
  })

  it('draws a pattern even without a fill colour, following the text colour', () => {
    const variables = boxVariables({ ...plainBox(), pattern: 'dots' })
    expect(variables['--box-image']).toContain('currentColor')
  })

  it('has sharp or rounded corners', () => {
    expect(boxVariables({ ...plainBox(), corners: 'sharp' })['--box-radius']).toBe('0px')
    expect(boxVariables(plainBox())['--box-radius']).toBe('1.5rem')
  })

  it("sets the box's text colour", () => {
    const box = mountBox({ background: '#123456', text: '#fefefe' })
    expect(box.attributes('style')).toContain('--box-text: #fefefe')
    expect(box.classes()).toContain('text-(--box-text)')
  })

  it('re-mixes muted text, rules and links from the box text colour', () => {
    const variables = boxVariables({ ...plainBox(), background: '#123456', text: '#fefefe' })
    expect(variables['--color-muted']).toBe('color-mix(in srgb, #fefefe 75%, transparent)')
    expect(variables['--color-accent']).toBe('#fefefe')
  })

  it('gives a block saved before boxes existed the plain style', () => {
    const olderBlock = { id: crypto.randomUUID(), type: 'quote', quote: 'Hello.', source: '' }
    expect(blockSchema.parse(olderBlock).style).toEqual(plainBox())
  })

  it('refuses an opacity outside 0 to 100', () => {
    const block = {
      id: crypto.randomUUID(),
      type: 'quote',
      quote: 'Hello.',
      source: '',
      style: { ...plainBox(), opacity: 140 },
    }
    expect(blockSchema.safeParse(block).success).toBe(false)
  })
})
