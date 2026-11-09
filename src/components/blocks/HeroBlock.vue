<script setup lang="ts">
import { computed } from 'vue'
import type { BlockOf } from '@shared/blocks'
import FramedImage from '@/components/ui/FramedImage.vue'
import SiteLink from '@/components/ui/SiteLink.vue'

// A big banner: heading, a line under it, an optional button, its own
// colours if the owner picked them, and an optional background picture
// (dimmed so the words stay readable). At the top of a page its heading is
// the page's title (h1).
const props = defineProps<{ block: BlockOf<'hero'>; isPageTitle: boolean }>()

const colours = computed(() => ({
  backgroundColor: props.block.backgroundColour || undefined,
  color: props.block.textColour || undefined,
}))
</script>

<template>
  <section
    class="relative overflow-hidden rounded-sm px-6 py-16 text-center @2xl:py-24"
    :class="block.imageKey ? 'bg-ink text-cream' : 'bg-paper-deep'"
    :style="colours"
  >
    <div v-if="block.imageKey" class="absolute inset-0 overflow-hidden opacity-45">
      <FramedImage :image-key="block.imageKey" :crop="block.imageCrop" alt="" eager />
    </div>
    <div class="relative">
      <component :is="isPageTitle ? 'h1' : 'h2'" class="text-5xl font-semibold @2xl:text-7xl">{{
        block.heading
      }}</component>
      <p
        v-if="block.subheading"
        class="mt-4 text-xl italic @2xl:text-2xl"
        :class="block.imageKey || block.textColour ? '' : 'text-muted'"
      >
        {{ block.subheading }}
      </p>
      <SiteLink
        v-if="block.buttonLabel && block.buttonUrl"
        :to="block.buttonUrl"
        class="mt-8 inline-block rounded-full bg-button px-6 py-3 font-sans font-semibold text-button-text hover:opacity-85"
        >{{ block.buttonLabel }}</SiteLink
      >
    </div>
  </section>
</template>
