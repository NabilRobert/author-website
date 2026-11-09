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
  it('home shows the author, the newest book and the latest news', async () => {
    const page = await renderPage('/mara')
    expect(page.find('h1').text()).toBe('Mara Ellison')
    expect(page.text()).toContain('The Lantern Year')
    expect(page.text()).toContain('Reading and signing')
  })

  it('books page lists a series in reading order with buy links', async () => {
    const page = await renderPage('/mara/books')
    const titles = page.findAll('article h3').map((heading) => heading.text())
    expect(titles).toEqual(['The Lantern Year', 'The Low Tide House', 'Between Two Ferries', 'The Salt Wedding'])
    expect(page.text()).toContain('Saltmarsh, book 2')
    expect(page.find('a[href="https://example.com/buy/lantern-year"]').exists()).toBe(true)
  })

  it('books without a cover image get a typeset cover', async () => {
    const page = await renderPage('/mara/books')
    expect(page.find('[role="img"][aria-label="Cover of The Salt Wedding"]').exists()).toBe(true)
  })

  it('about page shows its picture-and-text, list and quote blocks', async () => {
    const page = await renderPage('/mara/about')
    expect(page.find('h1').text()).toBe('About')
    expect(page.findAll('.prose-text p').length).toBeGreaterThan(1)
    expect(page.findAll('ul.list-disc li')).toHaveLength(3)
    expect(page.find('blockquote').text()).toContain('Every family is an island')
  })

  it('the menu lists the pages marked for it, in order, without the front page', async () => {
    const page = await renderPage('/mara')
    const menu = page.findAll('nav[aria-label="Main"] a').map((link) => link.text())
    expect(menu).toEqual(['Books', 'About', 'News', 'Press', 'Contact'])
  })

  it('the banner button links to another page of the site', async () => {
    const page = await renderPage('/mara')
    expect(page.find('main a[href="/mara/books"]').text()).toBe('See the books')
  })

  it('contact page links the email and the newsletter', async () => {
    const page = await renderPage('/mara/contact')
    expect(page.find('a[href="mailto:hello@example.com"]').exists()).toBe(true)
    expect(page.text()).toContain('Sign up to the newsletter')
  })

  it('press kit shows the short bio to copy', async () => {
    const page = await renderPage('/mara/press')
    expect(page.text()).toContain('Short bio')
    expect(page.text()).toContain('the Saltmarsh trilogy')
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
    expect(menu[0]).toBe('/mara/books')
  })

  it('an unknown address shows the not-found page', async () => {
    const page = await renderPage('/mara/no-such-page')
    expect(page.find('h1').text()).toBe('Page not found')
  })
})
