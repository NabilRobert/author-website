<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { imageUrl } from '@/content/format'

// A gallery picture shown full size over the page, uncropped, with its
// caption, Previous / Next and Close. It is the browser's own modal
// <dialog>, which keeps keyboard focus inside and closes on Esc; the arrow
// keys step through the pictures. (A library such as PhotoSwipe needs each
// picture's size up front, which Framed doesn't store.)
const props = defineProps<{ pictures: { imageKey: string; description: string }[] }>()
// Which picture is open; null when closed.
const openIndex = defineModel<number | null>({ required: true })
const dialog = ref<HTMLDialogElement>()

const picture = computed(() => (openIndex.value === null ? undefined : props.pictures[openIndex.value]))
const hasSeveral = computed(() => props.pictures.length > 1)

watch(openIndex, (index) => {
  if (index === null) dialog.value?.close()
  else if (!dialog.value?.open) dialog.value?.showModal()
})

// Wraps around: after the last picture comes the first.
function step(offset: 1 | -1) {
  if (openIndex.value === null) return
  openIndex.value = (openIndex.value + offset + props.pictures.length) % props.pictures.length
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'ArrowRight') step(1)
  if (event.key === 'ArrowLeft') step(-1)
}

// A click on the dark area around the picture (the dialog itself) closes it.
function onClick(event: MouseEvent) {
  if (event.target === dialog.value) openIndex.value = null
}

const BUTTON = 'rounded-full bg-white/15 px-4 py-2 font-sans text-white hover:bg-white/30'
</script>

<template>
  <dialog
    ref="dialog"
    aria-label="Picture, full size"
    class="m-0 h-dvh max-h-none w-dvw max-w-none bg-transparent p-4 backdrop:bg-black/85 open:flex open:flex-col"
    @close="openIndex = null"
    @keydown="onKey"
    @click="onClick"
  >
    <div class="flex justify-end">
      <button type="button" :class="BUTTON" @click="openIndex = null">Close ✕</button>
    </div>
    <figure v-if="picture" class="flex min-h-0 flex-1 flex-col items-center justify-center gap-3">
      <img
        :src="imageUrl(picture.imageKey)"
        :alt="picture.description"
        class="min-h-0 max-w-full flex-1 object-contain"
      />
      <figcaption v-if="picture.description" class="font-sans text-white">{{ picture.description }}</figcaption>
    </figure>
    <div v-if="hasSeveral" class="flex items-center justify-center gap-4 font-sans text-white">
      <button type="button" :class="BUTTON" @click="step(-1)">← Previous</button>
      <span>{{ (openIndex ?? 0) + 1 }} of {{ pictures.length }}</span>
      <button type="button" :class="BUTTON" @click="step(1)">Next →</button>
    </div>
  </dialog>
</template>
