import { describe, expect, it } from 'vitest'
import type { Book } from '@shared/schema'
import { formatDate, groupBooksBySeries, newestFirst, paragraphs, seriesLabel } from '@/content/format'
import { demoContent } from '@shared/demo-content'

function book(title: string, seriesName = '', seriesPosition: number | null = null): Book {
  return { ...demoContent.books[0]!, id: title, title, seriesName, seriesPosition }
}

describe('groupBooksBySeries', () => {
  it('puts a series in reading order where its first book was listed', () => {
    const books = [book('Solo A'), book('Two', 'Tides', 2), book('Solo B'), book('One', 'Tides', 1)]
    const groups = groupBooksBySeries(books)
    expect(groups.map((group) => group.books.map((b) => b.title))).toEqual([['Solo A'], ['One', 'Two'], ['Solo B']])
  })

  it('keeps each standalone book in its own group', () => {
    expect(groupBooksBySeries([book('A'), book('B')])).toHaveLength(2)
  })

  it('puts a series book without a number last in its series', () => {
    const groups = groupBooksBySeries([book('Unnumbered', 'Tides'), book('One', 'Tides', 1)])
    expect(groups[0]?.books.map((b) => b.title)).toEqual(['One', 'Unnumbered'])
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

describe('newestFirst', () => {
  it('sorts news by date, newest first, without changing the input', () => {
    const items = demoContent.news
    const sorted = newestFirst([...items].reverse())
    expect(sorted.map((item) => item.happensOn)).toEqual(['2026-12-05', '2026-03-12'])
  })
})
