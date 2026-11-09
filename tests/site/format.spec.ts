import { describe, expect, it } from 'vitest'
import type { Work } from '@shared/schema'
import { formatDate, groupWorks, imageUrl, newestFirst, paragraphs } from '@/content/format'
import { demoContent } from '@shared/demo-content'

function work(title: string, group = ''): Work {
  return { ...demoContent.works[0]!, id: title, title, group }
}

describe('groupWorks', () => {
  it('keeps the owner order exactly, re-sorting nothing', () => {
    const works = [work('Two', 'Tides'), work('Solo'), work('One', 'Tides')]
    const groups = groupWorks(works)
    expect(groups.map((group) => group.works.map((b) => b.title))).toEqual([['Two'], ['Solo'], ['One']])
  })

  it('gives neighbouring works of one group a shared heading', () => {
    const works = [work('Solo'), work('One', 'Tides'), work('Two', 'Tides')]
    const groups = groupWorks(works)
    expect(groups.map((group) => group.group)).toEqual(['', 'Tides'])
    expect(groups[1]?.works.map((b) => b.title)).toEqual(['One', 'Two'])
  })

  it('keeps each work without a group on its own', () => {
    expect(groupWorks([work('A'), work('B')])).toHaveLength(2)
  })
})

describe('formatDate', () => {
  it('writes the date out in words', () => {
    expect(formatDate('2026-03-12')).toBe('12 March 2026')
  })

  it('leaves a missing date empty', () => {
    expect(formatDate('')).toBe('')
  })
})

describe('paragraphs', () => {
  it('splits on blank lines and drops empty ones', () => {
    expect(paragraphs('One.\n\n\nTwo\nstill two.\n\n')).toEqual(['One.', 'Two\nstill two.'])
  })
})

describe('imageUrl', () => {
  it('points at the address the API serves the picture from', () => {
    expect(imageUrl('images/0b8e2f4c-3a1d-4c6b-8e7f-2d9a5c1b3e01.png')).toBe(
      '/api/images/0b8e2f4c-3a1d-4c6b-8e7f-2d9a5c1b3e01.png',
    )
  })
})

describe('newestFirst', () => {
  it('sorts news by date, newest first, without changing the input', () => {
    const items = demoContent.news
    const sorted = newestFirst([...items].reverse())
    expect(sorted.map((item) => item.happensOn)).toEqual(['2026-12-05', '2026-03-12'])
  })
})
