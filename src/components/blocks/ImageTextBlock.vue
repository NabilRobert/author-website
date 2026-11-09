<script setup lang="ts">
import type { BlockOf } from '@shared/blocks'
import { paragraphs } from '@/content/format'
import FramedImage from '@/components/ui/FramedImage.vue'
import BlockHeading from '@/components/ui/BlockHeading.vue'
import { PICTURE_BESIDE_TEXT_CLASSES, PICTURE_CORNER_CLASSES, WORK_SHAPE_CLASSES } from '@/content/frames'

// A picture beside text, on the left or the right, in the shape and
// corners the owner picked. On a phone the picture goes above the text.
defineProps<{ block: BlockOf<'imageText'> }>()
</script>

<template>
  <section
    class="grid items-start gap-8 @3xl:gap-12"
    :class="PICTURE_BESIDE_TEXT_CLASSES[block.imageShape][block.imageSide]"
  >
    <div
      v-if="block.imageKey"
      class="w-full overflow-hidden shadow-md"
      :class="[
        WORK_SHAPE_CLASSES[block.imageShape],
        PICTURE_CORNER_CLASSES[block.pictureCorners],
        block.imageShape === 'portrait' ? 'max-w-72' : 'max-w-md',
        { '@3xl:order-2': block.imageSide === 'right' },
      ]"
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
