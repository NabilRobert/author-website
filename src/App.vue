<script setup lang="ts">
import SiteHeader from '@/components/layout/SiteHeader.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
</script>

<template>
  <a
    href="#main"
    class="sr-only bg-accent px-4 py-2 font-sans text-cream focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
    >Skip to content</a
  >
  <SiteHeader />
  <main id="main" tabindex="-1" class="page-width focus:outline-none">
    <RouterView />
  </main>
  <SiteFooter />
</template>
