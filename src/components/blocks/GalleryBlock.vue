<script setup lang="ts">
import type { BlockOf } from '@shared/blocks'
import BlockHeading from '@/components/ui/BlockHeading.vue'
import FramedImage from '@/components/ui/FramedImage.vue'
import { PICTURE_CORNER_CLASSES, WORK_SHAPE_CLASSES } from '@/content/frames'

// A grid of pictures in one shape, each with its caption. Two side by side
// on a phone; the owner's number of columns on a wider screen.
defineProps<{ block: BlockOf<'gallery'> }>()

const COLUMN_CLASSES = {
  2: '@2xl:grid-cols-2',
  3: '@2xl:grid-cols-3',
  4: '@2xl:grid-cols-4',
} as const
</script>

<template>
  <section>
    <BlockHeading :text="block.heading" />
    <ul class="grid grid-cols-2 gap-4 @2xl:gap-6" :class="COLUMN_CLASSES[block.columns]">
      <li v-for="(picture, index) in block.pictures" :key="index">
        <figure v-if="picture.imageKey">
          <div
            class="overflow-hidden shadow-md"
            :class="[WORK_SHAPE_CLASSES[block.imageShape], PICTURE_CORNER_CLASSES[block.pictureCorners]]"
          >
            <FramedImage :image-key="picture.imageKey" :crop="picture.imageCrop" :alt="picture.description" />
          </div>
          <figcaption v-if="picture.description" class="mt-2 font-sans text-sm text-muted">
            {{ picture.description }}
          </figcaption>
        </figure>
      </li>
    </ul>
  </section>
</template>
