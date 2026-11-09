<script setup lang="ts">
import type { Link } from '@shared/schema'
import SiteLink from '@/components/ui/SiteLink.vue'

// A row of links shown as buttons: where to buy a book, where to find the
// author online, or a buttons block.
defineProps<{ links: Link[]; label: string }>()
</script>

<template>
  <ul v-if="links.length" :aria-label="label" class="flex flex-wrap gap-3">
    <li v-for="link in links" :key="link.url">
      <SiteLink
        :to="link.url"
        class="inline-block rounded-full bg-button px-4 py-2 font-sans text-sm font-semibold text-button-text transition-opacity hover:opacity-85"
        >{{ link.label }}</SiteLink
      >
    </li>
  </ul>
</template>
