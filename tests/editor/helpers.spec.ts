import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BlockThumbnail from '@/editor/tabs/BlockThumbnail.vue'
import { moveItem, newBlock, newPage } from '@/editor/newItems'
import { slugify } from '@shared/addresses'
import { describeLocation } from '@/editor/problems'
import { blockSchema } from '@shared/blocks'
import { BLOCK_NAMES } from '@shared/blocks'
import type { BlockType } from '@shared/blocks'
import { demoContent } from '@shared/demo-content'
import { pageSchema } from '@shared/schema'
import { PAGE_TEMPLATES, WORK_PAGE_TEMPLATES } from '@/editor/pageTemplates'
import { copyBlocks } from '@/editor/savedLayouts'

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
    expect(describeLocation(['profile', 'contactEmail'], demoContent)).toBe('About you › Contact email')
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

describe('page layouts', () => {
  it.each(PAGE_TEMPLATES.map((template) => [template.name, template] as const))(
    'the %s layout makes a page that can be saved as it is',
    (_name, template) => {
      const page = { ...newPage(template.title, []), blocks: template.blocks() }
      expect(pageSchema.safeParse(page).success).toBe(true)
    },
  )

  it.each(WORK_PAGE_TEMPLATES.map((template) => [template.name, template] as const))(
    'the %s layout for a work makes blocks that can be saved as they are',
    (_name, template) => {
      for (const block of template.blocks()) expect(blockSchema.safeParse(block).success).toBe(true)
    },
  )

  it('gives every block a new id each time, so two pages from one layout never share blocks', () => {
    const project = PAGE_TEMPLATES.find((template) => template.key === 'project')!
    const firstIds = project.blocks().map((block) => block.id)
    expect(project.blocks().some((block) => firstIds.includes(block.id))).toBe(false)
  })
})

describe('copyBlocks', () => {
  it('gives every copy a new id and shares nothing with the original', () => {
    const original = demoContent.pages[2]!.blocks
    const copies = copyBlocks(original)
    expect(copies.map((block) => block.id)).not.toContain(original[0]!.id)
    const list = copies.find((block) => block.type === 'list')!
    if (list.type === 'list') list.items.push('Only in the copy')
    expect(JSON.stringify(original)).not.toContain('Only in the copy')
  })
})
