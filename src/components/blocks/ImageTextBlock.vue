<script setup lang="ts">
import type { BlockOf } from '@shared/blocks'
import { paragraphs } from '@/content/format'
import FramedImage from '@/components/ui/FramedImage.vue'
import BlockHeading from '@/components/ui/BlockHeading.vue'

// A picture beside text, on the left or the right. On a phone the picture
// goes above the text.
defineProps<{ block: BlockOf<'imageText'> }>()
</script>

<template>
  <section class="grid items-start gap-8 @3xl:grid-cols-[18rem_1fr] @3xl:gap-12">
    <div
      v-if="block.imageKey"
      class="aspect-[4/5] w-full max-w-72 overflow-hidden rounded-sm shadow-md"
      :class="{ '@3xl:order-2': block.imageSide === 'right' }"
    >
      <FramedImage :image-key="block.imageKey" :crop="block.imageCrop" :alt="block.imageDescription" />
    </div>
    <div :class="{ '@3xl:col-span-2': !block.imageKey }">
      <BlockHeading :text="block.heading" />
      <div class="prose-text">
        <p v-for="(paragraph, index) in paragraphs(block.body)" :key="index">{{ paragraph }}</p>
      </div>
    </div>
  </section>
</template>
