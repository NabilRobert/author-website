<script setup lang="ts">
import type { BlockOf } from '@shared/blocks'
import { imageUrl } from '@/content/format'
import SiteLink from '@/components/ui/SiteLink.vue'

// A big banner: heading, a line under it, an optional button, and an
// optional background picture (darkened so the words stay readable). At the
// top of a page its heading is the page's title (h1).
defineProps<{ block: BlockOf<'hero'>; isPageTitle: boolean }>()
</script>

<template>
  <section
    class="relative overflow-hidden rounded-sm px-6 py-16 text-center sm:py-24"
    :class="block.imageKey ? 'bg-ink text-cream' : ''"
  >
    <img
      v-if="block.imageKey"
      :src="imageUrl(block.imageKey)"
      alt=""
      class="absolute inset-0 h-full w-full object-cover opacity-45"
    />
    <div class="relative">
      <component :is="isPageTitle ? 'h1' : 'h2'" class="text-5xl font-semibold sm:text-7xl">{{
        block.heading
      }}</component>
      <p v-if="block.subheading" class="mt-4 text-xl italic sm:text-2xl" :class="block.imageKey ? '' : 'text-muted'">
        {{ block.subheading }}
      </p>
      <SiteLink
        v-if="block.buttonLabel && block.buttonUrl"
        :to="block.buttonUrl"
        class="mt-8 inline-block rounded-full bg-accent px-6 py-3 font-sans font-semibold text-cream hover:opacity-90"
        >{{ block.buttonLabel }}</SiteLink
      >
    </div>
  </section>
</template>
