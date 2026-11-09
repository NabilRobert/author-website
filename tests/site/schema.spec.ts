import { describe, expect, it } from 'vitest'
import { demoContent } from '@shared/demo-content'
import { siteContentSchema } from '@shared/schema'

function withFirstBuyLink(url: string) {
  const [first, ...rest] = demoContent.books
  return { ...demoContent, books: [{ ...first!, buyLinks: [{ label: 'Shop', url }] }, ...rest] }
}

function withHeroButton(buttonUrl: string) {
  const [home, ...rest] = demoContent.pages
  const [hero, ...otherBlocks] = home!.blocks
  const pages = [{ ...home!, blocks: [{ ...hero!, buttonUrl }, ...otherBlocks] }, ...rest]
  return siteContentSchema.safeParse({ ...demoContent, pages })
}

function firstErrorMessage(input: unknown): string | undefined {
  const result = siteContentSchema.safeParse(input)
  return result.success ? undefined : result.error.issues[0]?.message
}

describe('site content schema', () => {
  it('accepts the demo content', () => {
    expect(siteContentSchema.safeParse(demoContent).success).toBe(true)
  })

  it('rejects a javascript: buy link, which would run code for visitors', () => {
    expect(firstErrorMessage(withFirstBuyLink('javascript:alert(1)'))).toBe(
      'Enter a full web address starting with https://',
    )
  })

  it('rejects a buy link without https://', () => {
    expect(siteContentSchema.safeParse(withFirstBuyLink('amazon.com/book')).success).toBe(false)
  })

  it('asks for a title when a book has none', () => {
    const [first, ...rest] = demoContent.books
    const untitled = { ...demoContent, books: [{ ...first!, title: '   ' }, ...rest] }
    expect(firstErrorMessage(untitled)).toBe('Add the book title.')
  })

  it('rejects an image key outside the images folder', () => {
    const author = { ...demoContent.author, photoKey: '../secrets.txt' }
    expect(siteContentSchema.safeParse({ ...demoContent, author }).success).toBe(false)
  })

  it('needs a front page', () => {
    const pages = demoContent.pages.filter((page) => page.slug !== '')
    expect(firstErrorMessage({ ...demoContent, pages })).toBe('The site needs a front page.')
  })

  it('refuses two pages at the same address', () => {
    const copy = { ...demoContent.pages[1]!, id: crypto.randomUUID() }
    expect(firstErrorMessage({ ...demoContent, pages: [...demoContent.pages, copy] })).toBe(
      'Two pages use /books. Change one.',
    )
  })

  it('refuses a page at an address the site uses itself', () => {
    const editPage = { ...demoContent.pages[1]!, id: crypto.randomUUID(), slug: 'edit' }
    expect(firstErrorMessage({ ...demoContent, pages: [...demoContent.pages, editPage] })).toBe(
      'That address is used by the site itself. Pick another.',
    )
  })

  it('accepts a banner button to a page on this site', () => {
    expect(withHeroButton('/contact').success).toBe(true)
  })

  it('rejects a javascript: banner button', () => {
    expect(withHeroButton('javascript:alert(1)').success).toBe(false)
  })

  it('rejects a block of a type it does not know', () => {
    const [home, ...rest] = demoContent.pages
    const oddBlock = { id: crypto.randomUUID(), type: 'video', url: 'https://example.com' }
    const pages = [{ ...home!, blocks: [oddBlock] }, ...rest]
    expect(siteContentSchema.safeParse({ ...demoContent, pages }).success).toBe(false)
  })

  it('allows an empty contact email and newsletter address', () => {
    const author = { ...demoContent.author, contactEmail: '', newsletterUrl: '' }
    expect(siteContentSchema.safeParse({ ...demoContent, author }).success).toBe(true)
  })
})
