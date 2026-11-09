/**
 * Example content: an invented designer and maker with invented work, so a
 * new page starts with something to change rather than a blank screen, and
 * tests have a full site to check. Nothing here describes a real person.
 */
import type { SiteContent } from './schema'
import { DEFAULT_THEME, plainBox } from './theme'
import { centredCrop } from './fields'

// Fixed ids so the example is the same on every load; any valid UUID works.
const id = (n: number) => `a1000000-0000-4000-8000-${String(n).padStart(12, '0')}`

const ABOUT_TEXT =
  'Alex Rowan designs signs, identities and small apps for public places: libraries, markets, ferries.\n\nAlex studied architecture, then spent five years making wayfinding for a city transport office before starting a small studio.\n\n(Alex Rowan is an example person. Replace this text with your own in the editor.)'

export const demoContent: SiteContent = {
  profile: {
    name: 'Alex Rowan',
    bioShort:
      'Alex Rowan is a designer and maker of signs, identities and small apps for public places, working from a small studio by the harbour.',
    photoKey: null,
    photoCrop: centredCrop(),
    contactEmail: 'hello@example.com',
    newsletterUrl: 'https://example.com/newsletter',
    socialLinks: [
      { label: 'Instagram', url: 'https://example.com/instagram' },
      { label: 'LinkedIn', url: 'https://example.com/linkedin' },
    ],
  },
  theme: DEFAULT_THEME,
  works: [
    {
      id: '6f1d3a52-6c1e-4d5e-9f2a-1b7c0e4a9d01',
      title: 'Lantern',
      subtitle: 'Mobile app',
      group: '',
      date: '2026-03-12',
      description:
        'A small app that tells ferry passengers, in plain words, which boat to take and when to walk to the pier.',
      imageKey: null,
      imageCrop: centredCrop(),
      links: [
        { label: 'Try it', url: 'https://example.com/lantern' },
        { label: 'Case study', url: 'https://example.com/lantern/case-study' },
      ],
      quotes: [{ quote: 'The first ferry app my mother could use.', source: 'An example review' }],
      pageSlug: 'lantern',
      pageBlocks: [
        {
          id: id(901),
          style: plainBox(),
          type: 'text',
          heading: 'The brief',
          body: 'The ferry company had timetables nobody could read on a phone, and passengers missed boats.',
        },
        {
          id: id(902),
          style: plainBox(),
          type: 'text',
          heading: 'What I did',
          body: 'One screen: your pier, the next boat, and when to start walking. Tested on the boats for a month.',
        },
      ],
    },
    {
      id: '6f1d3a52-6c1e-4d5e-9f2a-1b7c0e4a9d02',
      title: 'Harbour Library',
      subtitle: 'Wayfinding and signs',
      group: 'Public places',
      date: '2025-05-04',
      description: 'Signs for a library in an old customs house, in three languages, readable from a wheelchair.',
      imageKey: null,
      imageCrop: centredCrop(),
      links: [{ label: 'Photos', url: 'https://example.com/harbour-library' }],
      quotes: [{ quote: 'Nobody asks us where the toilets are any more.', source: 'An example librarian' }],
      pageSlug: '',
      pageBlocks: [],
    },
    {
      id: '6f1d3a52-6c1e-4d5e-9f2a-1b7c0e4a9d03',
      title: 'Tidewater Market',
      subtitle: 'Identity and signs',
      group: 'Public places',
      date: '2024-09-21',
      description: 'A name, a logo and stall signs for a covered fish market that opens at four in the morning.',
      imageKey: null,
      imageCrop: centredCrop(),
      links: [{ label: 'Photos', url: 'https://example.com/tidewater-market' }],
      quotes: [],
      pageSlug: '',
      pageBlocks: [],
    },
    {
      id: '6f1d3a52-6c1e-4d5e-9f2a-1b7c0e4a9d04',
      title: 'Ferry Posters',
      subtitle: 'Poster series',
      group: '',
      date: '2023-10-02',
      description: 'Twelve posters, one for each ferry route, printed in two colours.',
      imageKey: null,
      imageCrop: centredCrop(),
      links: [],
      quotes: [],
      pageSlug: '',
      pageBlocks: [],
    },
  ],
  news: [
    {
      id: '0b8e2f4c-3a1d-4c6b-8e7f-2d9a5c1b3e01',
      kind: 'event',
      title: 'Talk: signs that help people find their way',
      body: 'An evening talk about designing for people in a hurry, followed by questions.',
      happensOn: '2026-12-05',
      place: 'Harbour Street Library',
      linkUrl: 'https://example.com/events/wayfinding-talk',
    },
    {
      id: '0b8e2f4c-3a1d-4c6b-8e7f-2d9a5c1b3e02',
      kind: 'news',
      title: 'Lantern is out now',
      body: 'The ferry app is free for everyone from today. Thank you to everyone who tested it on the boats.',
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
          style: plainBox(),
          type: 'hero',
          heading: 'Alex Rowan',
          subheading: 'Signs, identities and small apps for public places.',
          imageKey: null,
          imageCrop: centredCrop(),
          buttonLabel: 'See the work',
          buttonUrl: '/work',
          backgroundColour: '',
          textColour: '',
          bannerShape: '',
          pictureCorners: 'soft',
        },
        {
          id: id(102),
          style: plainBox(),
          type: 'works',
          heading: 'Latest work',
          show: 'newest',
          pickedWorkIds: [],
          pictureShape: '',
          pictureCorners: 'soft',
        },
        { id: id(103), style: plainBox(), type: 'news', heading: 'Latest news', limit: 2 },
      ],
    },
    {
      id: id(2),
      slug: 'work',
      title: 'Work',
      showInMenu: true,
      blocks: [
        {
          id: id(201),
          style: plainBox(),
          type: 'works',
          heading: '',
          show: 'all',
          pickedWorkIds: [],
          pictureShape: '',
          pictureCorners: 'soft',
        },
      ],
    },
    {
      id: id(3),
      slug: 'about',
      title: 'About',
      showInMenu: true,
      blocks: [
        {
          id: id(301),
          style: plainBox(),
          type: 'imageText',
          heading: 'About Alex',
          body: ABOUT_TEXT,
          imageKey: null,
          imageCrop: centredCrop(),
          imageDescription: '',
          imageSide: 'left',
          imageShape: 'portrait',
          pictureCorners: 'soft',
        },
        {
          id: id(302),
          style: plainBox(),
          type: 'list',
          heading: 'What I make',
          numbered: false,
          items: ['Signs and wayfinding', 'Names, logos and identities', 'Small, plain apps'],
        },
        {
          id: id(303),
          style: plainBox(),
          type: 'quote',
          quote: 'A good sign is one nobody notices.',
          source: 'Alex Rowan',
        },
      ],
    },
    {
      id: id(4),
      slug: 'news',
      title: 'News',
      showInMenu: true,
      blocks: [{ id: id(401), style: plainBox(), type: 'news', heading: '', limit: null }],
    },
    {
      id: id(5),
      slug: 'press',
      title: 'Press',
      showInMenu: true,
      blocks: [
        {
          id: id(501),
          style: plainBox(),
          type: 'pressKit',
          heading: 'For journalists, clients and organisers',
          photoShape: 'portrait',
          pictureShape: '',
          pictureCorners: 'soft',
        },
      ],
    },
    {
      id: id(6),
      slug: 'contact',
      title: 'Contact',
      showInMenu: true,
      blocks: [
        {
          id: id(601),
          style: plainBox(),
          type: 'text',
          heading: '',
          body: 'For projects, talks and interviews, email me.',
        },
        { id: id(602), style: plainBox(), type: 'contact', heading: '' },
      ],
    },
  ],
  updatedAt: '',
}
