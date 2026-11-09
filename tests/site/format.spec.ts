import { describe, expect, it } from 'vitest'
import type { Book } from '@shared/schema'
import { formatDate, groupAdjacentSeries, imageUrl, newestFirst, paragraphs, seriesLabel } from '@/content/format'
import { demoContent } from '@shared/demo-content'

function book(title: string, seriesName = '', seriesPosition: number | null = null): Book {
  return { ...demoContent.books[0]!, id: title, title, seriesName, seriesPosition }
}

describe('groupAdjacentSeries', () => {
  it('keeps the owner order exactly, re-sorting nothing', () => {
    const books = [book('Two', 'Tides', 2), book('Solo'), book('One', 'Tides', 1)]
    const groups = groupAdjacentSeries(books)
    expect(groups.map((group) => group.books.map((b) => b.title))).toEqual([['Two'], ['Solo'], ['One']])
  })

  it('gives neighbouring books of one series a shared heading', () => {
    const books = [book('Solo'), book('One', 'Tides', 1), book('Two', 'Tides', 2)]
    const groups = groupAdjacentSeries(books)
    expect(groups.map((group) => group.seriesName)).toEqual(['', 'Tides'])
    expect(groups[1]?.books.map((b) => b.title)).toEqual(['One', 'Two'])
  })

  it('keeps each standalone book in its own group', () => {
    expect(groupAdjacentSeries([book('A'), book('B')])).toHaveLength(2)
  })
})

describe('seriesLabel', () => {
  it('names the series and the number', () => {
    expect(seriesLabel(book('Two', 'Tides', 2))).toBe('Tides, book 2')
  })

  it('is empty for a standalone book', () => {
    expect(seriesLabel(book('Solo'))).toBe('')
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
