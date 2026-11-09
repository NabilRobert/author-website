import { onBeforeUnmount, ref } from 'vue'

/**
 * Whether the window is at least `minWidth` wide, kept current as it is
 * resized. Where the browser can't tell (no matchMedia, as in tests), it
 * answers "not wide", the layout that works everywhere.
 */
export function useWideScreen(minWidth: string) {
  const query = typeof window.matchMedia === 'function' ? window.matchMedia(`(min-width: ${minWidth})`) : null
  const isWide = ref(query?.matches ?? false)
  const update = (event: MediaQueryListEvent) => (isWide.value = event.matches)
  query?.addEventListener('change', update)
  onBeforeUnmount(() => query?.removeEventListener('change', update))
  return isWide
}
