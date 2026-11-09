<script setup lang="ts">
import { computed } from 'vue'
import type { ImageCrop } from '@shared/fields'
import type { WorkShape } from '@shared/theme'
import { WORK_SHAPE_CLASSES } from '@/content/frames'
import FramedImage from '@/components/ui/FramedImage.vue'

// A work's picture in the site's chosen shape: the uploaded image, or, until
// there is one, a plain typeset card (title and owner's name on a colour
// block) so the page never shows a broken or empty box.
const props = defineProps<{
  title: string
  ownerName: string
  imageKey: string | null
  imageCrop: ImageCrop
  shape: WorkShape
}>()

const TYPESET_COLOURS = ['bg-card-1', 'bg-card-2', 'bg-card-3', 'bg-card-4']

// The same title always gets the same colour.
const typesetColour = computed(() => {
  let hash = 0
  for (const character of props.title) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  return TYPESET_COLOURS[hash % TYPESET_COLOURS.length]
})
</script>

<template>
  <div v-if="imageKey" :class="WORK_SHAPE_CLASSES[shape]" class="w-full overflow-hidden rounded-sm shadow-md">
    <FramedImage :image-key="imageKey" :crop="imageCrop" :alt="title" />
  </div>
  <div
    v-else
    role="img"
    :aria-label="title"
    :class="[typesetColour, WORK_SHAPE_CLASSES[shape]]"
    class="flex w-full flex-col justify-between rounded-sm p-[10%] text-cream shadow-md"
  >
    <span class="text-[clamp(1rem,2.4cqw,1.6rem)] leading-tight font-semibold">{{ title }}</span>
    <span class="small-caps opacity-90">{{ ownerName }}</span>
  </div>
</template>
