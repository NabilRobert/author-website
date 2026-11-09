<script setup lang="ts">
import { computed } from 'vue'
import type { ImageCrop } from '@shared/fields'
import { imageUrl } from '@/content/format'

// A picture filling its frame (the parent gives the frame's size and
// shape), positioned by the owner's crop: the focus point stays in view and
// the zoom scales around it. The editor's cropper uses the same rules, so
// what the owner sets there is exactly what visitors see.
const props = defineProps<{ imageKey: string; crop: ImageCrop; alt: string; eager?: boolean }>()

const style = computed(() => {
  const { x, y, zoom } = props.crop
  return { objectPosition: `${x}% ${y}%`, transform: `scale(${zoom})`, transformOrigin: `${x}% ${y}%` }
})
</script>

<template>
  <img
    :src="imageUrl(imageKey)"
    :alt="alt"
    :style="style"
    :loading="eager ? 'eager' : 'lazy'"
    class="h-full w-full object-cover"
    draggable="false"
  />
</template>
