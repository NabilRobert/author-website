/**
 * YouTube and Vimeo links: recognising the ones people paste, and the
 * player address to show them. YouTube plays from youtube-nocookie.com and
 * Vimeo with dnt=1, so neither sets tracking cookies; the player only loads
 * once a visitor presses play (src/components/blocks/VideoBlock.vue).
 */
export interface Video {
  provider: 'youtube' | 'vimeo'
  id: string
}

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'www.youtube-nocookie.com',
])
const VIMEO_HOSTS = new Set(['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'])
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/
const VIMEO_ID = /^\d{1,12}$/

/**
 * The video a link points at, or null. Understands youtube.com/watch?v=…,
 * youtu.be/…, youtube.com/shorts/… and /embed/…, vimeo.com/123 and
 * player.vimeo.com/video/123.
 */
export function parseVideoUrl(link: string): Video | null {
  let url: URL
  try {
    url = new URL(link.trim())
  } catch {
    return null
  }
  if (url.protocol !== 'https:') return null
  if (YOUTUBE_HOSTS.has(url.hostname)) return youtubeVideo(url)
  if (VIMEO_HOSTS.has(url.hostname)) return vimeoVideo(url)
  return null
}

function youtubeVideo(url: URL): Video | null {
  const parts = url.pathname.split('/').filter(Boolean)
  const id = url.hostname === 'youtu.be' ? parts[0] : parts[0] === 'watch' ? url.searchParams.get('v') : parts[1]
  const isVideoPath = url.hostname === 'youtu.be' || ['watch', 'shorts', 'embed'].includes(parts[0] ?? '')
  return isVideoPath && id && YOUTUBE_ID.test(id) ? { provider: 'youtube', id } : null
}

function vimeoVideo(url: URL): Video | null {
  const id = url.pathname.split('/').filter(Boolean).at(-1)
  return id && VIMEO_ID.test(id) ? { provider: 'vimeo', id } : null
}

/** The player's address, starting to play at once (the visitor just pressed play). */
export function playerUrl(video: Video): string {
  if (video.provider === 'youtube') return `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1`
  return `https://player.vimeo.com/video/${video.id}?autoplay=1&dnt=1`
}
