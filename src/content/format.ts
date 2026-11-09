/**
 * Small helpers that turn stored content into what a page shows: grouped
 * works, readable dates, paragraphs and image addresses.
 */
import type { Work, NewsItem } from '@shared/schema'

/** A run of works shown under one heading: a group, or one work on its own. */
export interface BookGroup {
  group: string
  works: Work[]
}

/**
 * The works in the owner's order, nothing re-sorted. Works of the same
 * group that sit next to each other share a heading; a work with no group is
 * a group of its own.
 */
export function groupWorks(works: Work[]): BookGroup[] {
  const groups: BookGroup[] = []
  for (const work of works) {
    const previous = groups.at(-1)
    if (work.group && previous?.group === work.group) previous.works.push(work)
    else groups.push({ group: work.group, works: [work] })
  }
  return groups
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
