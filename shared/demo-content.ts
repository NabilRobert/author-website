/**
 * Placeholder content: an invented author with invented books, so the site
 * can be built and shown before the real author's details arrive. Nothing
 * here describes a real person. The database seed loads this same document.
 */
import type { SiteContent } from './schema'
import { DEFAULT_THEME } from './theme'
import { centredCrop } from './fields'

// Fixed ids so the demo is the same on every load; any valid UUID works.
const id = (n: number) => `a1000000-0000-4000-8000-${String(n).padStart(12, '0')}`

const ABOUT_TEXT =
  'Mara Ellison grew up between a harbour town and her grandmother’s kitchen, which is where most of her stories still begin.\n\nShe started writing on night shifts at a ferry ticket office, filling notebooks between departures. Those notebooks became The Low Tide House, the first book of the Saltmarsh trilogy.\n\n(Mara Ellison is a placeholder author. Replace this text in the editor.)'

export const demoContent: SiteContent = {
  author: {
    name: 'Mara Ellison',
    bioShort:
      'Mara Ellison writes literary fiction set on small islands and in large families. She is the author of the Saltmarsh trilogy and the novel The Lantern Year.',
    photoKey: null,
    photoCrop: centredCrop(),
    contactEmail: 'hello@example.com',
    newsletterUrl: 'https://example.com/newsletter',
    socialLinks: [
      { label: 'Instagram', url: 'https://example.com/instagram' },
      { label: 'Goodreads', url: 'https://example.com/goodreads' },
    ],
  },
  theme: DEFAULT_THEME,
  books: [
    {
      id: '6f1d3a52-6c1e-4d5e-9f2a-1b7c0e4a9d01',
      title: 'The Lantern Year',
      seriesName: '',
      seriesPosition: null,
      publishedOn: '2026-03-12',
      blurb:
        'For one year, the lighthouse keeper’s daughter keeps a lantern lit for a brother who left without a word. Then a letter arrives with the wrong name on it.',
      coverKey: null,
      coverCrop: centredCrop(),
      buyLinks: [
        { label: 'Bookshop', url: 'https://example.com/buy/lantern-year' },
        { label: 'E-book', url: 'https://example.com/ebook/lantern-year' },
      ],
      reviews: [{ quote: 'Tender, funny and quietly devastating.', source: 'A placeholder review' }],
    },
    {
      id: '6f1d3a52-6c1e-4d5e-9f2a-1b7c0e4a9d02',
      title: 'The Low Tide House',
      seriesName: 'Saltmarsh',
      seriesPosition: 1,
      publishedOn: '2022-05-04',
      blurb: 'Three sisters inherit a house that floods twice a day. None of them wants it. All of them move in.',
      coverKey: null,
      coverCrop: centredCrop(),
      buyLinks: [{ label: 'Bookshop', url: 'https://example.com/buy/low-tide-house' }],
      reviews: [{ quote: 'A house you will not want to leave.', source: 'Another placeholder review' }],
    },
    {
      id: '6f1d3a52-6c1e-4d5e-9f2a-1b7c0e4a9d03',
      title: 'Between Two Ferries',
      seriesName: 'Saltmarsh',
      seriesPosition: 2,
      publishedOn: '2023-09-21',
      blurb: 'The middle sister takes the last ferry out and misses the first one back.',
      coverKey: null,
      coverCrop: centredCrop(),
      buyLinks: [{ label: 'Bookshop', url: 'https://example.com/buy/between-two-ferries' }],
      reviews: [],
    },
    {
      id: '6f1d3a52-6c1e-4d5e-9f2a-1b7c0e4a9d04',
      title: 'The Salt Wedding',
      seriesName: 'Saltmarsh',
      seriesPosition: 3,
      publishedOn: '2024-10-02',
      blurb: 'Everyone comes home for the wedding. Not everyone is invited.',
      coverKey: null,
      coverCrop: centredCrop(),
      buyLinks: [{ label: 'Bookshop', url: 'https://example.com/buy/salt-wedding' }],
      reviews: [],
    },
  ],
  news: [
    {
      id: '0b8e2f4c-3a1d-4c6b-8e7f-2d9a5c1b3e01',
      kind: 'event',
      title: 'Reading and signing: The Lantern Year',
      body: 'An evening reading followed by questions and signing.',
      happensOn: '2026-12-05',
      place: 'Harbour Street Books',
      linkUrl: 'https://example.com/events/lantern-reading',
    },
    {
      id: '0b8e2f4c-3a1d-4c6b-8e7f-2d9a5c1b3e02',
      kind: 'news',
      title: 'The Lantern Year is out now',
      body: 'My new novel is in bookshops and online from today. Thank you to everyone who read early copies.',
      happensOn: '2026-03-12',
      place: '',
      linkUrl: '',
    },
  ],
  pages: [
    {
      id: id(1),
      slug: '',
      title: 'Home',
      showInMenu: false,
      blocks: [
        {
          id: id(101),
          type: 'hero',
          heading: 'Mara Ellison',
          subheading: 'Quiet novels about loud families.',
          imageKey: null,
          imageCrop: centredCrop(),
          buttonLabel: 'See the books',
          buttonUrl: '/books',
          backgroundColour: '',
          textColour: '',
        },
        { id: id(102), type: 'books', heading: 'Newest book', show: 'newest' },
        { id: id(103), type: 'news', heading: 'Latest news', limit: 2 },
      ],
    },
    {
      id: id(2),
      slug: 'books',
      title: 'Books',
      showInMenu: true,
      blocks: [{ id: id(201), type: 'books', heading: '', show: 'all' }],
    },
    {
      id: id(3),
      slug: 'about',
      title: 'About',
      showInMenu: true,
      blocks: [
        {
          id: id(301),
          type: 'imageText',
          heading: 'About Mara',
          body: ABOUT_TEXT,
          imageKey: null,
          imageCrop: centredCrop(),
          imageDescription: '',
          imageSide: 'left',
        },
        {
          id: id(302),
          type: 'list',
          heading: 'Things that end up in my books',
          numbered: false,
          items: ['Ferries and the people who miss them', 'Kitchens with too many chairs', 'Weather, always'],
        },
        {
          id: id(303),
          type: 'quote',
          quote: 'Every family is an island with its own tides.',
          source: 'The Low Tide House',
        },
      ],
    },
    {
      id: id(4),
      slug: 'news',
      title: 'News',
      showInMenu: true,
      blocks: [{ id: id(401), type: 'news', heading: '', limit: null }],
    },
    {
      id: id(5),
      slug: 'press',
      title: 'Press',
      showInMenu: true,
      blocks: [{ id: id(501), type: 'pressKit', heading: 'For journalists and event organisers' }],
    },
    {
      id: id(6),
      slug: 'contact',
      title: 'Contact',
      showInMenu: true,
      blocks: [
        {
          id: id(601),
          type: 'text',
          heading: '',
          body: 'For events, interviews and rights, email me. I read everything, slowly.',
        },
        { id: id(602), type: 'contact', heading: '' },
      ],
    },
  ],
  updatedAt: '',
}
