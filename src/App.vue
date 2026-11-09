<script setup lang="ts">
import SiteHeader from '@/components/layout/SiteHeader.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
import { useLoadStatus } from '@/content/useSiteContent'
import { useSiteTheme } from '@/composables/useSiteTheme'

const { status } = useLoadStatus()
useSiteTheme()
</script>

<template>
  <template v-if="status === 'ready'">
    <a
      href="#main"
      class="sr-only bg-button px-4 py-2 font-sans text-button-text focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >Skip to content</a
    >
    <SiteHeader />
    <main id="main" tabindex="-1" class="page-width focus:outline-none">
      <RouterView />
    </main>
    <SiteFooter />
  </template>
  <main v-else class="page-width py-24 text-center text-lg" aria-live="polite">
    <p v-if="status === 'loading'" class="text-muted">Loading…</p>
    <p v-else-if="status === 'not-set-up'">This site is being set up. Please come back soon.</p>
    <p v-else>The site couldn't load. Check your internet connection and refresh the page.</p>
  </main>
</template>
