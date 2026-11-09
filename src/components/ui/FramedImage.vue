<script setup lang="ts">
import { computed } from 'vue'
import type { ImageCrop } from '@shared/fields'
import { imageUrl } from '@/content/format'

// A picture filling its frame (the parent gives the frame's size and
// shape), positioned by the owner's crop: the focus point stays in view and
// the zoom scales around it. The crop's numbers arrive as CSS variables and
// Tailwind classes do the rest. The editor's cropper uses this same
// component, so what the owner sets there is exactly what visitors see.
const props = defineProps<{ imageKey: string; crop: ImageCrop; alt: string; eager?: boolean }>()

const cropVariables = computed(() => ({
  '--focus': `${props.crop.x}% ${props.crop.y}%`,
  '--zoom': String(props.crop.zoom),
}))
</script>

<template>
  <img
    :src="imageUrl(imageKey)"
    :alt="alt"
    :style="cropVariables"
    :loading="eager ? 'eager' : 'lazy'"
    class="h-full w-full origin-(--focus) scale-(--zoom) object-cover object-(--focus)"
    draggable="false"
  />
</template>
