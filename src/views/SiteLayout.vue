<script setup lang="ts">
import { computed, watch, watchEffect } from 'vue'
import { loadSiteContent, useLoadStatus } from '@/content/useSiteContent'
import { provideSiteName } from '@/content/sitePath'
import { themeVariables } from '@/content/themeVariables'
import { loadFonts } from '@/styles/fonts'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'

// Someone's public site at /<site>: loads their content, wears their theme
// (colours, fonts, background) and wraps each of their pages in their
// header and footer.
const props = defineProps<{ site: string }>()
const { status, loadedContent } = useLoadStatus()
provideSiteName(props.site)

watch(
  () => props.site,
  (site) => void loadSiteContent(site),
  { immediate: true },
)

const themeStyle = computed(() => (loadedContent.value ? themeVariables(loadedContent.value.theme) : {}))
watchEffect(() => {
  if (loadedContent.value) loadFonts([loadedContent.value.theme.headingFont, loadedContent.value.theme.bodyFont])
})
</script>

<template>
  <div
    v-if="status === 'ready' && loadedContent"
    :style="themeStyle"
    class="site-background min-h-screen font-[family-name:var(--font-body)] text-ink @container"
  >
    <div class="site-panel">
      <a
        href="#main"
        class="sr-only bg-button px-4 py-2 font-sans text-button-text focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >Skip to content</a
      >
      <SiteHeader :content="loadedContent" />
      <main id="main" tabindex="-1" class="page-width focus:outline-none">
        <RouterView />
      </main>
      <SiteFooter :content="loadedContent" />
    </div>
  </div>
  <main v-else class="page-width py-24 text-center text-lg" aria-live="polite">
    <p v-if="status === 'loading'" class="text-muted">Loading…</p>
    <p v-else-if="status === 'not-set-up'">This page is being set up. Please come back soon.</p>
    <template v-else-if="status === 'no-site'">
      <p>There is no page at framed.my.id/{{ site }}.</p>
      <RouterLink to="/" class="mt-4 inline-block text-accent underline">Make your own on Framed</RouterLink>
    </template>
    <p v-else>The page couldn't load. Check your internet connection and refresh the page.</p>
  </main>
</template>
