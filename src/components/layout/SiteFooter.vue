<script setup lang="ts">
import type { SiteContent } from '@shared/schema'

// The newsletter link, the copyright line and the builder's credit, on
// every page. The credit is fixed here, not editable in the editor.
defineProps<{ content: SiteContent }>()
const year = new Date().getFullYear()
const BUILDER = { name: '@nabilrobert', url: 'https://github.com/NabilRobert' }
</script>

<template>
  <footer class="mt-24 border-t border-line">
    <div class="page-width flex flex-col gap-4 py-10 font-sans text-sm text-muted @2xl:flex-row @2xl:justify-between">
      <div>
        <p>© {{ year }} {{ content.author.name }}</p>
        <p class="mt-1 text-xs">
          Powered by <a :href="BUILDER.url" rel="noopener" class="underline">{{ BUILDER.name }}</a>
        </p>
      </div>
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
