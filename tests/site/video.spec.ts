import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import VideoBlock from '@/components/blocks/VideoBlock.vue'
import { blockSchema } from '@shared/blocks'
import type { BlockOf } from '@shared/blocks'
import { parseVideoUrl, playerUrl } from '@shared/videos'
import { plainBox } from '@shared/theme'

describe('video links', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s', 'youtube', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ', 'youtube', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'youtube', 'dQw4w9WgXcQ'],
    ['https://m.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'dQw4w9WgXcQ'],
    ['https://vimeo.com/76979871', 'vimeo', '76979871'],
    ['https://player.vimeo.com/video/76979871', 'vimeo', '76979871'],
  ])('understands %s', (link, provider, id) => {
    expect(parseVideoUrl(link)).toEqual({ provider, id })
  })

  it.each([
    'https://example.com/watch?v=dQw4w9WgXcQ',
    'http://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/channel/UC123',
    'https://www.youtube.com/watch?v=short',
    'https://vimeo.com/about',
    'not a link',
  ])('refuses %s', (link) => {
    expect(parseVideoUrl(link)).toBeNull()
  })

  it('plays YouTube without its tracking cookies, and Vimeo with do-not-track', () => {
    expect(playerUrl({ provider: 'youtube', id: 'dQw4w9WgXcQ' })).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1',
    )
    expect(playerUrl({ provider: 'vimeo', id: '76979871' })).toContain('dnt=1')
  })
})

describe('a video block', () => {
  const block = (url: string): BlockOf<'video'> =>
    blockSchema.parse({
      id: crypto.randomUUID(),
      style: plainBox(),
      type: 'video',
      heading: '',
      url,
      caption: 'The launch',
    }) as BlockOf<'video'>

  it('loads nothing from YouTube until the visitor presses play', async () => {
    const shown = mount(VideoBlock, { props: { block: block('https://youtu.be/dQw4w9WgXcQ') } })
    expect(shown.find('iframe').exists()).toBe(false)
    await shown.find('button').trigger('click')
    expect(shown.find('iframe').attributes('src')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1')
    expect(shown.find('figcaption').text()).toBe('The launch')
  })

  it("stays a button for a click that arrives already prevented, as in the editor's preview", async () => {
    const shown = mount(VideoBlock, { props: { block: block('https://vimeo.com/76979871') } })
    const click = new MouseEvent('click', { bubbles: true, cancelable: true })
    click.preventDefault()
    shown.find('button').element.dispatchEvent(click)
    await shown.vm.$nextTick()
    expect(shown.find('iframe').exists()).toBe(false)
  })

  it('refuses to save a link it cannot play', () => {
    const result = blockSchema.safeParse({ ...block(''), url: 'https://example.com/my-video' })
    expect(result.error?.issues[0]?.message).toContain('Paste a YouTube or Vimeo link')
  })
})
