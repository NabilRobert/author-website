/**
 * Blank items the editor adds when the owner presses "Add …": a block of
 * any type, a work, a news item or a page. Each gets a fresh id.
 */
import type { BlockOf, BlockType } from '@shared/blocks'
import type { Work, NewsItem, Page } from '@shared/schema'
import { centredCrop } from '@shared/fields'
import { plainBox } from '@shared/theme'

type BlockFields = { [T in BlockType]: Omit<BlockOf<T>, 'id' | 'type' | 'style'> }

// What each new block starts with: empty text, or a sensible choice.
const NEW_BLOCK_FIELDS: { [T in BlockType]: () => BlockFields[T] } = {
  hero: () => ({
    heading: 'Your heading',
    subheading: '',
    imageKey: null,
    imageCrop: centredCrop(),
    buttonLabel: '',
    buttonUrl: '',
    backgroundColour: '',
    textColour: '',
    bannerShape: '',
    pictureCorners: 'soft',
  }),
  text: () => ({ heading: '', body: 'Write here.' }),
  gallery: () => ({ heading: '', pictures: [], columns: 3, imageShape: 'square', pictureCorners: 'soft' }),
  imageText: () => ({
    heading: '',
    body: '',
    imageKey: null,
    imageCrop: centredCrop(),
    imageDescription: '',
    imageSide: 'left',
    imageShape: 'portrait',
    pictureCorners: 'soft',
  }),
  list: () => ({ heading: '', numbered: false, items: ['First item'] }),
  quote: () => ({ quote: 'The quote.', source: '' }),
  buttons: () => ({ heading: '', links: [{ label: 'Button', url: '/' }] }),
  works: () => ({ heading: 'Work', show: 'all', pickedWorkIds: [], pictureShape: '', pictureCorners: 'soft' }),
  news: () => ({ heading: 'News and events', limit: 3 }),
  contact: () => ({ heading: 'Get in touch' }),
  pressKit: () => ({ heading: 'Press kit', photoShape: 'portrait', pictureShape: '', pictureCorners: 'soft' }),
}

export function newBlock<T extends BlockType>(type: T): BlockOf<T> {
  const block = { id: crypto.randomUUID(), type, style: plainBox(), ...NEW_BLOCK_FIELDS[type]() }
  // TypeScript can't follow a generic spread back to one member of the
  // union; NEW_BLOCK_FIELDS's type already ties each type to its fields.
  return block as unknown as BlockOf<T>
}

export function newWork(): Work {
  return {
    id: crypto.randomUUID(),
    title: 'New work',
    subtitle: '',
    group: '',
    date: '',
    description: '',
    imageKey: null,
    imageCrop: centredCrop(),
    links: [],
    quotes: [],
  }
}

export function newNewsItem(today: Date): NewsItem {
  return {
    id: crypto.randomUUID(),
    kind: 'news',
    title: 'New post',
    body: '',
    happensOn: today.toISOString().slice(0, 10),
    place: '',
    linkUrl: '',
  }
}

/** A new page with a free address based on its title: "New page" → /new-page, /new-page-2, … */
export function newPage(title: string, takenSlugs: string[]): Page {
  const base = slugify(title) || 'page'
  let slug = base
  for (let suffix = 2; takenSlugs.includes(slug); suffix++) slug = `${base}-${suffix}`
  return { id: crypto.randomUUID(), slug, title, showInMenu: true, blocks: [] }
}

/** "Tour Dates 2027!" → "tour-dates-2027"; accents are dropped ("Café" → "cafe"). */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Moves the item at `index` one place up (-1) or down (+1); does nothing at the ends. */
export function moveItem<T>(items: T[], index: number, offset: -1 | 1): void {
  const target = index + offset
  if (target < 0 || target >= items.length) return
  const [item] = items.splice(index, 1)
  items.splice(target, 0, item as T)
}
