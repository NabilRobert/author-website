<script setup lang="ts">
import { computed, ref } from 'vue'
import type { GalleryPicture } from '@shared/blocks'
import type { PictureCorners, WorkShape } from '@shared/theme'
import FramedImage from '@/components/ui/FramedImage.vue'
import { PICTURE_CORNER_CLASSES, WORK_SHAPE_CLASSES } from '@/content/frames'
import GalleryLightbox from '@/components/blocks/GalleryLightbox.vue'

// A grid of pictures in one shape, each with its caption, for a gallery
// block and for a work's more pictures. Two side by side on a phone;
// `columns` on a wider screen. Clicking a picture opens it full size
// (GalleryLightbox).
const props = defineProps<{
  pictures: GalleryPicture[]
  columns: 2 | 3 | 4
  shape: WorkShape
  corners: PictureCorners
}>()

// Only uploaded pictures (an unsaved draft can have empty ones).
type UploadedPicture = GalleryPicture & { imageKey: string }
const uploaded = computed(() =>
  props.pictures.filter((picture): picture is UploadedPicture => picture.imageKey !== null),
)
const openIndex = ref<number | null>(null)

// In the editor's preview, clicks are taken for selecting the block and
// arrive already prevented (src/editor/SitePreview.vue), so it stays shut.
function open(index: number, event: MouseEvent) {
  if (!event.defaultPrevented) openIndex.value = index
}

const COLUMN_CLASSES = {
  2: '@2xl:grid-cols-2',
  3: '@2xl:grid-cols-3',
  4: '@2xl:grid-cols-4',
} as const
</script>

<template>
  <ul class="grid grid-cols-2 gap-4 @2xl:gap-6" :class="COLUMN_CLASSES[columns]">
    <li v-for="(picture, index) in uploaded" :key="index">
      <figure>
        <button
          type="button"
          class="block w-full cursor-zoom-in overflow-hidden shadow-md"
          :class="[WORK_SHAPE_CLASSES[shape], PICTURE_CORNER_CLASSES[corners]]"
          :aria-label="`Open ${picture.description || `picture ${index + 1}`} full size`"
          @click="open(index, $event)"
        >
          <FramedImage :image-key="picture.imageKey" :crop="picture.imageCrop" alt="" />
        </button>
        <figcaption v-if="picture.description" class="mt-2 font-sans text-sm text-muted">
          {{ picture.description }}
        </figcaption>
      </figure>
    </li>
  </ul>
  <GalleryLightbox v-model="openIndex" :pictures="uploaded" />
</template>
