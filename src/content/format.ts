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
 * The books in the owner's order, nothing re-sorted. Books of the same
 * series that sit next to each other share a heading; a standalone book is
 * a group of its own.
 */
export function groupAdjacentSeries(books: Book[]): BookGroup[] {
  const groups: BookGroup[] = []
  for (const book of books) {
    const previous = groups.at(-1)
    if (book.seriesName && previous?.seriesName === book.seriesName) previous.books.push(book)
    else groups.push({ seriesName: book.seriesName, books: [book] })
  }
  return groups
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
