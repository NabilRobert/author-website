/**
 * Small helpers that turn stored content into what a page shows: grouped
 * books, readable dates, paragraphs and image addresses.
 */
import type { Book, NewsItem } from '@shared/schema'

/** A run of books shown under one heading: a series, or one standalone book. */
export interface BookGroup {
  seriesName: string
  books: Book[]
}

/**
 * Groups a series' books together, in reading order, at the place where the
 * owner listed the series' first book. Standalone books stay where they are.
 */
export function groupBooksBySeries(books: Book[]): BookGroup[] {
  const groups: BookGroup[] = []
  const groupBySeries = new Map<string, BookGroup>()
  for (const book of books) {
    const existing = book.seriesName ? groupBySeries.get(book.seriesName) : undefined
    if (existing) {
      existing.books.push(book)
      continue
    }
    const group = { seriesName: book.seriesName, books: [book] }
    groups.push(group)
    if (book.seriesName) groupBySeries.set(book.seriesName, group)
  }
  for (const group of groups) group.books.sort(bySeriesPosition)
  return groups
}

function bySeriesPosition(a: Book, b: Book): number {
  return (a.seriesPosition ?? Infinity) - (b.seriesPosition ?? Infinity)
}

/** "Saltmarsh, book 2", or '' for a standalone book. */
export function seriesLabel(book: Book): string {
  if (!book.seriesName) return ''
  if (book.seriesPosition === null) return book.seriesName
  return `${book.seriesName}, book ${book.seriesPosition}`
}

/** News and events, newest first. */
export function newestFirst(items: NewsItem[]): NewsItem[] {
  return [...items].sort((a, b) => b.happensOn.localeCompare(a.happensOn))
}

/** "12 March 2026" from "2026-03-12"; '' stays ''. */
export function formatDate(isoDate: string): string {
  if (!isoDate) return ''
  // Noon UTC, so the day never shifts in the visitor's time zone.
  const date = new Date(`${isoDate}T12:00:00Z`)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

/** Splits text on blank lines, the way the owner types paragraphs. */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

/**
 * Where the browser loads a stored image from: the key `images/<id>.png`
 * is served at `/api/images/<id>.png` (server/image-routes.ts).
 */
export function imageUrl(key: string): string {
  return `/api/${key}`
}
