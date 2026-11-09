import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory } from 'vue-router'
import { createHead } from '@unhead/vue/client'
import App from '@/App.vue'
import { createAppRouter } from '@/router'
import { loadSiteContent } from '@/content/useSiteContent'
import { demoContent } from '@shared/demo-content'

function stubApi(response: Response | Error) {
  const fetchStub = vi.fn(async () => {
    if (response instanceof Error) throw response
    return response
  })
  vi.stubGlobal('fetch', fetchStub)
  return fetchStub
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

async function renderPage(path: string, apiResponse: Response | Error = Response.json(demoContent)) {
  const fetchStub = stubApi(apiResponse)
  await loadSiteContent()
  expect(fetchStub).toHaveBeenCalledWith('/api/content')
  const router = createAppRouter(createMemoryHistory())
  await router.push(path)
  const wrapper = mount(App, { global: { plugins: [router, createHead()] } })
  await flushPromises()
  return wrapper
}

describe('public pages', () => {
  it('home shows the author, the newest book and the latest news', async () => {
    const page = await renderPage('/')
    expect(page.find('h1').text()).toBe('Mara Ellison')
    expect(page.text()).toContain('The Lantern Year')
    expect(page.text()).toContain('Reading and signing')
  })

  it('books page lists a series in reading order with buy links', async () => {
    const page = await renderPage('/books')
    const titles = page.findAll('article h3').map((heading) => heading.text())
    expect(titles).toEqual(['The Lantern Year', 'The Low Tide House', 'Between Two Ferries', 'The Salt Wedding'])
    expect(page.text()).toContain('Saltmarsh, book 2')
    expect(page.find('a[href="https://example.com/buy/lantern-year"]').exists()).toBe(true)
  })

  it('books without a cover image get a typeset cover', async () => {
    const page = await renderPage('/books')
    expect(page.find('[role="img"][aria-label="Cover of The Salt Wedding"]').exists()).toBe(true)
  })

  it('about page shows its picture-and-text, list and quote blocks', async () => {
    const page = await renderPage('/about')
    expect(page.find('h1').text()).toBe('About')
    expect(page.findAll('.prose-text p').length).toBeGreaterThan(1)
    expect(page.findAll('ul.list-disc li')).toHaveLength(3)
    expect(page.find('blockquote').text()).toContain('Every family is an island')
  })

  it('the menu lists the pages marked for it, in order, without the front page', async () => {
    const page = await renderPage('/')
    const menu = page.findAll('nav[aria-label="Main"] a').map((link) => link.text())
    expect(menu).toEqual(['Books', 'About', 'News', 'Press', 'Contact'])
  })

  it('the banner button links to another page of the site', async () => {
    const page = await renderPage('/')
    expect(page.find('main a[href="/books"]').text()).toBe('See the books')
  })

  it('contact page links the email and the newsletter', async () => {
    const page = await renderPage('/contact')
    expect(page.find('a[href="mailto:hello@example.com"]').exists()).toBe(true)
    expect(page.text()).toContain('Sign up to the newsletter')
  })

  it('press kit shows the short bio to copy', async () => {
    const page = await renderPage('/press')
    expect(page.text()).toContain('Short bio')
    expect(page.text()).toContain('the Saltmarsh trilogy')
  })

  it('says the site is being set up when the API has no content yet', async () => {
    const page = await renderPage('/', Response.json({ error: 'not set up' }, { status: 404 }))
    expect(page.text()).toContain('This site is being set up.')
  })

  it('asks the visitor to refresh when the API cannot be reached', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const page = await renderPage('/', new TypeError('Failed to fetch'))
    expect(page.text()).toContain("The site couldn't load.")
  })

  it('asks the visitor to refresh when the API fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const page = await renderPage('/', Response.json({ error: 'x' }, { status: 500 }))
    expect(page.text()).toContain("The site couldn't load.")
  })

  it('credits the builder in the footer with a link to his GitHub', async () => {
    const page = await renderPage('/')
    const credit = page.find('footer a[href="https://github.com/NabilRobert"]')
    expect(credit.text()).toBe('@nabilrobert')
  })

  it('an unknown address shows the not-found page', async () => {
    const page = await renderPage('/no-such-page')
    expect(page.find('h1').text()).toBe('Page not found')
  })
})
