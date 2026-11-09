import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory } from 'vue-router'
import { createHead } from '@unhead/vue/client'
import App from '@/App.vue'
import { createAppRouter } from '@/router'
import { fakeApi, json, offline } from '../fake-api'
import type { FakeAnswer } from '../fake-api'
import { demoContent } from '@shared/demo-content'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

async function renderPage(path: string, contentAnswer: FakeAnswer = json(demoContent)) {
  fakeApi({ 'GET /api/sites/mara/content': contentAnswer })
  const router = createAppRouter(createMemoryHistory())
  await router.push(path)
  const wrapper = mount(App, { global: { plugins: [router, createHead()] } })
  await flushPromises()
  return wrapper
}

describe('public pages', () => {
  it('home shows the profile, the newest work and the latest news', async () => {
    const page = await renderPage('/mara')
    expect(page.find('h1').text()).toBe(demoContent.profile.name)
    expect(page.text()).toContain('Lantern')
    expect(page.text()).toContain('Talk: signs that help people find their way')
  })

  it('work page lists the work in the owner order, with group headings and links', async () => {
    const page = await renderPage('/mara/work')
    const titles = page.findAll('article h3').map((heading) => heading.text())
    expect(titles).toEqual(['Lantern', 'Harbour Library', 'Tidewater Market', 'Ferry Posters'])
    expect(page.findAll('section h2').map((heading) => heading.text())).toContain('Public places')
    expect(page.text()).toContain('Mobile app')
    expect(page.find('a[href="https://example.com/lantern"]').exists()).toBe(true)
  })

  describe("works' own pages", () => {
    // Harbour Library has its page switched off.
    const [lantern, harbour, tidewater, posters] = demoContent.works
    const IMAGE = 'images/0b8e2f4c-3a1d-4c6b-8e7f-2d9a5c1b3e01.jpg'
    const morePictures = [{ imageKey: IMAGE, imageCrop: { x: 50, y: 50, zoom: 1 }, description: 'The app on a phone' }]
    const works = [{ ...lantern!, morePictures }, { ...harbour!, showPage: false }, tidewater!, posters!]
    const content = json({ ...demoContent, works })
    const moreWork = async (path: string) => (await renderPage(path, content)).find('nav[aria-label="More work"]')

    it('every work links to its page from the list, unless its page is off', async () => {
      const page = await renderPage('/mara/work', content)
      expect(page.find('article h3 a[href="/mara/work/lantern"]').text()).toBe('Lantern')
      expect(page.find('article h3 a[href="/mara/work/tidewater-market"]').exists()).toBe(true)
      expect(page.find('article h3 a[href="/mara/work/harbour-library"]').exists()).toBe(false)
      expect(page.findAll('a').filter((link) => link.text() === 'See the whole project')).toHaveLength(3)
    })

    it('shows the details, then the more pictures, then the blocks', async () => {
      const page = await renderPage('/mara/work/lantern', content)
      expect(page.find('h1').text()).toBe('Lantern')
      expect(page.find('button[aria-label="Open The app on a phone full size"]').exists()).toBe(true)
      expect(page.text()).toContain('The brief')
      const back = page.findAll('a').find((link) => link.text().includes('All work'))
      expect(back?.attributes('href')).toBe('/mara/work')
    })

    it('says not found for a work whose page is off', async () => {
      const page = await renderPage('/mara/work/harbour-library', content)
      expect(page.find('h1').text()).toBe('Page not found')
    })

    it('links to the previous and next work, skipping pages that are off', async () => {
      const links = (await moreWork('/mara/work/lantern')).findAll('a')
      expect(links.map((link) => [link.attributes('rel'), link.attributes('href')])).toEqual([
        ['next', '/mara/work/tidewater-market'],
      ])
    })

    it('has no "next" on the last', async () => {
      const links = (await moreWork('/mara/work/ferry-posters')).findAll('a')
      expect(links.map((link) => link.attributes('rel'))).toEqual(['prev'])
      expect(links[0]!.text()).toContain('Tidewater Market')
    })

    it('leaves the links out when no other work has a page', async () => {
      const alone = json({ ...demoContent, works: works.map((work, index) => ({ ...work, showPage: index === 0 })) })
      const page = await renderPage('/mara/work/lantern', alone)
      expect(page.find('nav[aria-label="More work"]').exists()).toBe(false)
    })
  })

  it('work without a picture gets a typeset card in the site picture shape', async () => {
    const page = await renderPage('/mara/work')
    const card = page.find('[role="img"][aria-label="Ferry Posters"]')
    expect(card.exists()).toBe(true)
    expect(card.classes()).toContain('aspect-[4/3]')
  })

  it('about page shows its picture-and-text, list and quote blocks', async () => {
    const page = await renderPage('/mara/about')
    expect(page.find('h1').text()).toBe('About')
    expect(page.findAll('.prose-text p').length).toBeGreaterThan(1)
    expect(page.findAll('ul.list-disc li')).toHaveLength(3)
    expect(page.find('blockquote').text()).toContain('A good sign is one nobody notices.')
  })

  it('the menu lists the pages marked for it, in order, without the front page', async () => {
    const page = await renderPage('/mara')
    const menu = page.findAll('nav[aria-label="Main"] a').map((link) => link.text())
    expect(menu).toEqual(['Work', 'About', 'News', 'Press', 'Contact'])
  })

  it('the banner button links to another page of the site', async () => {
    const page = await renderPage('/mara')
    expect(page.find('main a[href="/mara/work"]').text()).toBe('See the work')
  })

  it('contact page links the email and the newsletter', async () => {
    const page = await renderPage('/mara/contact')
    expect(page.find('a[href="mailto:hello@example.com"]').exists()).toBe(true)
    expect(page.text()).toContain('Sign up to the newsletter')
  })

  it('press kit shows the short bio to copy', async () => {
    const page = await renderPage('/mara/press')
    expect(page.text()).toContain('Short bio')
    expect(page.text()).toContain('signs, identities and small apps')
  })

  it('says the site is being set up when the API has no content yet', async () => {
    const page = await renderPage('/mara', json({ error: 'not set up', reason: 'not-set-up' }, 404))
    expect(page.text()).toContain('This page is being set up.')
  })

  it('asks the visitor to refresh when the API cannot be reached', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const page = await renderPage('/mara', offline)
    expect(page.text()).toContain("The page couldn't load.")
  })

  it('asks the visitor to refresh when the API fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const page = await renderPage('/mara', json({ error: 'x' }, 500))
    expect(page.text()).toContain("The page couldn't load.")
  })

  it('credits the builder in the footer with a link to his GitHub', async () => {
    const page = await renderPage('/mara')
    const credit = page.find('footer a[href="https://github.com/NabilRobert"]')
    expect(credit.text()).toBe('@nabilrobert')
  })

  it('says there is no page at an address nobody has claimed', async () => {
    const page = await renderPage('/mara', json({ error: 'none', reason: 'no-site' }, 404))
    expect(page.text()).toContain('There is no page at framed.my.id/mara.')
  })

  it('links menu items inside the person site', async () => {
    const page = await renderPage('/mara')
    const menu = page.findAll('nav[aria-label="Main"] a').map((link) => link.attributes('href'))
    expect(menu[0]).toBe('/mara/work')
  })

  it('an unknown address shows the not-found page', async () => {
    const page = await renderPage('/mara/no-such-page')
    expect(page.find('h1').text()).toBe('Page not found')
  })
})
