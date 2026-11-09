<script setup lang="ts">
import type { SiteContent } from '@shared/schema'

// The newsletter link and the copyright line, on every page.
defineProps<{ content: SiteContent }>()
const year = new Date().getFullYear()
</script>

<template>
  <footer class="mt-24 border-t border-line">
    <div class="page-width flex flex-col gap-4 py-10 font-sans text-sm text-muted sm:flex-row sm:justify-between">
      <p>© {{ year }} {{ content.author.name }}</p>
      <a
        v-if="content.author.newsletterUrl"
        :href="content.author.newsletterUrl"
        rel="noopener"
        class="text-accent underline"
        >Get the newsletter</a
      >
    </div>
  </footer>
</template>
