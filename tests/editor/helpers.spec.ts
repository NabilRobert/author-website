import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BlockThumbnail from '@/editor/tabs/BlockThumbnail.vue'
import { moveItem, newBlock, newPage, slugify } from '@/editor/newItems'
import { describeLocation } from '@/editor/problems'
import { blockSchema } from '@shared/blocks'
import { BLOCK_NAMES } from '@shared/blocks'
import type { BlockType } from '@shared/blocks'
import { demoContent } from '@shared/demo-content'

describe('slugify', () => {
  it('turns a page name into an address', () => {
    expect(slugify('Tour Dates 2027!')).toBe('tour-dates-2027')
  })

  it('drops accents', () => {
    expect(slugify('Café Événements')).toBe('cafe-evenements')
  })
})

describe('newPage', () => {
  it('picks the next free address when the name is taken', () => {
    expect(newPage('New page', ['new-page', 'new-page-2']).slug).toBe('new-page-3')
  })

  it('falls back to "page" for a name with no letters or numbers', () => {
    expect(newPage('???', []).slug).toBe('page')
  })
})

describe('newBlock', () => {
  it.each(Object.keys(BLOCK_NAMES) as BlockType[])('makes a valid %s block', (type) => {
    expect(blockSchema.safeParse(newBlock(type)).success).toBe(true)
  })
})

describe('moveItem', () => {
  it('moves an item one place and leaves the ends alone', () => {
    const items = ['a', 'b', 'c']
    moveItem(items, 2, -1)
    expect(items).toEqual(['a', 'c', 'b'])
    moveItem(items, 0, -1)
    expect(items).toEqual(['a', 'c', 'b'])
  })
})

describe('describeLocation', () => {
  it('names the page, the block and the field', () => {
    const path = ['pages', 0, 'blocks', 0, 'buttonUrl']
    expect(describeLocation(path, demoContent)).toBe('Pages › Home › block 1 (Big banner) › Button link')
  })

  it('names the about-you field', () => {
    expect(describeLocation(['author', 'contactEmail'], demoContent)).toBe('About you › Contact email')
  })

  it('names the site for a whole-site problem', () => {
    expect(describeLocation(['pages'], demoContent)).toBe('Pages')
  })
})

describe('BlockThumbnail', () => {
  it.each(Object.keys(BLOCK_NAMES) as BlockType[])('draws a sketch for %s blocks', (type) => {
    const sketch = mount(BlockThumbnail, { props: { type } })
    expect(sketch.find('svg[aria-hidden="true"]').exists()).toBe(true)
    expect(sketch.findAll('rect, circle, path').length).toBeGreaterThan(1)
  })
})
