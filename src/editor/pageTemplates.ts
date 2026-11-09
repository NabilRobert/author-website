/**
 * Ready-made page layouts: a stack of blocks with starting text, picked
 * when adding a page (or giving a work its own page) and changed freely
 * afterwards. A template is only a starting point; nothing links the page
 * to it later.
 */
import { newBlock } from '@/editor/newItems'
import type { Block, BlockOf, BlockType } from '@shared/blocks'

/** A layout: what the picker shows, and the blocks it starts with. */
export interface LayoutTemplate {
  key: string
  name: string
  description: string
  blocks: () => Block[]
  // Set for the owner's own saved layouts (src/editor/savedLayouts.ts), which can be removed.
  savedLayoutId?: string
}

/** A layout for a new site page, with its title (and so its address). */
export interface PageTemplate extends LayoutTemplate {
  title: string
}

/** A new block of `type` with some fields filled in. */
function blockWith<T extends BlockType>(type: T, fields: Partial<BlockOf<T>> = {}): BlockOf<T> {
  return { ...newBlock(type), ...fields }
}

const text = (heading: string, body: string) => blockWith('text', { heading, body })

const BLANK: LayoutTemplate = {
  key: 'blank',
  name: 'Blank',
  description: 'An empty page to build yourself',
  blocks: () => [],
}

/** For the site's pages (the Pages tab). */
export const PAGE_TEMPLATES: PageTemplate[] = [
  { ...BLANK, title: 'New page' },
  {
    key: 'home',
    name: 'Home',
    description: 'A banner, your latest work and your latest news',
    title: 'Home',
    blocks: () => [
      blockWith('hero', { heading: 'Your name', subheading: 'What you make, in one line.' }),
      blockWith('works', { heading: 'Latest work', show: 'newest' }),
      blockWith('news', { heading: 'Latest news', limit: 2 }),
    ],
  },
  {
    key: 'about',
    name: 'About me',
    description: 'Your picture beside your story, what you do, and a quote',
    title: 'About',
    blocks: () => [
      blockWith('imageText', { heading: 'About me', body: 'Who you are, how you started, what you care about.' }),
      blockWith('list', { heading: 'What I do', items: ['One thing', 'Another thing', 'A third thing'] }),
      blockWith('quote', { quote: 'Something kind someone said about your work.', source: 'Who said it' }),
    ],
  },
  {
    key: 'project',
    name: 'Project',
    description: 'A banner, the story of one project, pictures, a quote and links',
    title: 'Project',
    blocks: () => [
      blockWith('hero', { heading: 'Project name', subheading: 'What it is, for whom, and when.' }),
      text('The brief', 'What was asked for, and why it mattered.'),
      blockWith('gallery', { heading: 'Pictures' }),
      text('What I did', 'Your part, the choices you made, and how it turned out.'),
      blockWith('quote', { quote: 'What the client or a visitor said.', source: 'Who said it' }),
      blockWith('buttons', { heading: '', links: [{ label: 'See it live', url: 'https://example.com' }] }),
    ],
  },
  {
    key: 'gallery',
    name: 'Gallery',
    description: 'A short introduction and a big grid of pictures',
    title: 'Gallery',
    blocks: () => [
      text('', 'A sentence or two about these pictures.'),
      blockWith('gallery', { heading: '', columns: 3 }),
    ],
  },
  {
    key: 'contact',
    name: 'Contact',
    description: 'A friendly line and your contact details',
    title: 'Contact',
    blocks: () => [text('', 'For projects, talks and interviews, email me.'), blockWith('contact')],
  },
  {
    key: 'press',
    name: 'Press',
    description: 'Your bio, photo and pictures of your work for journalists',
    title: 'Press',
    blocks: () => [blockWith('pressKit', { heading: 'For journalists, clients and organisers' })],
  },
]

/**
 * For a work's page (a new project in the Pages tab). The work's title,
 * cover, description, links and more pictures already sit at the top, so
 * these are the blocks below them.
 */
export const WORK_PAGE_TEMPLATES: LayoutTemplate[] = [
  {
    key: 'case-study',
    name: 'Case study',
    description: 'The brief, what you did, and what people said',
    blocks: () => [
      text('The brief', 'What was asked for, and why it mattered.'),
      text('What I did', 'Your part, the choices you made, and how it turned out.'),
      blockWith('quote', { quote: 'What the client or a visitor said.', source: 'Who said it' }),
    ],
  },
  {
    key: 'story',
    name: 'Story',
    description: 'Pictures and text taking turns, left and right',
    blocks: () => [
      blockWith('imageText', { heading: 'The start', body: 'Where it began.', imageSide: 'left' }),
      blockWith('imageText', { heading: 'The making', body: 'How it came together.', imageSide: 'right' }),
      blockWith('imageText', { heading: 'The result', body: 'Where it ended up.', imageSide: 'left' }),
    ],
  },
  { ...BLANK, name: 'Just the details', description: 'The details and pictures, nothing more' },
]
