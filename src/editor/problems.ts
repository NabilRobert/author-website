/**
 * Turns a validation problem's path (['pages', 2, 'blocks', 0, 'buttonUrl'])
 * into words the owner can find on screen: "Pages › About › block 1 (Big
 * banner) › Button link".
 */
import { BLOCK_NAMES } from '@shared/blocks'
import type { SiteContent } from '@shared/schema'

export interface SaveProblem {
  location: string
  message: string
}

const FIELD_NAMES: Record<string, string> = {
  name: 'Name',
  bioShort: 'Short bio',
  contactEmail: 'Contact email',
  newsletterUrl: 'Newsletter address',
  socialLinks: 'Social links',
  buyLinks: 'Where to buy',
  reviews: 'Review quotes',
  title: 'Title',
  seriesName: 'Series',
  seriesPosition: 'Number in series',
  publishedOn: 'Published on',
  blurb: 'Blurb',
  happensOn: 'Date',
  place: 'Place',
  linkUrl: 'Link',
  slug: 'Address',
  heading: 'Heading',
  subheading: 'Line under the heading',
  body: 'Text',
  buttonLabel: 'Button text',
  buttonUrl: 'Button link',
  items: 'List items',
  quote: 'Quote',
  source: 'Who said it',
  links: 'Buttons',
  label: 'Name',
  url: 'Web address',
}

type Path = readonly PropertyKey[]

export function describeLocation(path: Path, content: SiteContent): string {
  const [area, index, ...rest] = path
  const at = typeof index === 'number' ? index : -1
  if (area === 'books') return join(['Books', content.books[at]?.title], rest)
  if (area === 'news') return join(['News', content.news[at]?.title], rest)
  if (area === 'pages') return describePageLocation(content, at, rest)
  if (area === 'theme') return 'Look'
  if (area === 'author') return join(['About you'], [index ?? '', ...rest])
  return 'The site'
}

function describePageLocation(content: SiteContent, pageIndex: number, rest: Path): string {
  const page = content.pages[pageIndex]
  const [part, blockIndex, ...fields] = rest
  if (part !== 'blocks' || typeof blockIndex !== 'number') return join(['Pages', page?.title], rest)
  const block = page?.blocks[blockIndex]
  const blockName = block ? ` (${BLOCK_NAMES[block.type]})` : ''
  return join(['Pages', page?.title, `block ${blockIndex + 1}${blockName}`], fields)
}

// The named parts, then each field name and item number in the rest of the
// path: "… › Where to buy › no. 2 › Web address".
function join(parts: (string | undefined)[], rest: Path): string {
  const steps = rest.map((key) => {
    if (typeof key === 'number') return `no. ${key + 1}`
    return typeof key === 'string' ? FIELD_NAMES[key] : undefined
  })
  return [...parts, ...steps].filter(Boolean).join(' › ')
}
