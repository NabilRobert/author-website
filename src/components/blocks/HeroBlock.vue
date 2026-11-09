<script setup lang="ts">
import { computed } from 'vue'
import type { BlockOf } from '@shared/blocks'
import FramedImage from '@/components/ui/FramedImage.vue'
import SiteLink from '@/components/ui/SiteLink.vue'
import { BANNER_SHAPE_CLASSES, PICTURE_CORNER_CLASSES } from '@/content/frames'

// A big banner: heading, a line under it, an optional button, its own
// colours if the owner picked them, and an optional background picture
// (dimmed so the words stay readable), in the shape and corners the owner
// picked. At the top of a page its heading is the page's title (h1).
const props = defineProps<{ block: BlockOf<'hero'>; isPageTitle: boolean }>()

// The owner's colours arrive as CSS variables; the Tailwind classes below
// use them only when they are set, and otherwise fall back to the theme.
const colourVariables = computed(() => ({
  '--hero-background': props.block.backgroundColour,
  '--hero-text': props.block.textColour,
}))
const colourClasses = computed(() => {
  const { backgroundColour, textColour, imageKey } = props.block
  const background = backgroundColour ? 'bg-(--hero-background)' : imageKey ? 'bg-ink' : 'bg-paper-deep'
  const text = textColour ? 'text-(--hero-text)' : imageKey ? 'text-cream' : ''
  return [background, text]
})
const frameClasses = computed(() => {
  const { bannerShape, pictureCorners } = props.block
  return [bannerShape ? BANNER_SHAPE_CLASSES[bannerShape] : '', PICTURE_CORNER_CLASSES[pictureCorners]]
})
</script>

<template>
  <section
    class="relative flex flex-col justify-center overflow-hidden px-6 py-16 text-center @2xl:py-24"
    :class="[colourClasses, frameClasses]"
    :style="colourVariables"
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
