<script setup lang="ts">
import { ref, useId } from 'vue'
import { centredCrop } from '@shared/fields'
import type { ImageCrop } from '@shared/fields'
import FramedImage from '@/components/ui/FramedImage.vue'

// Crop a picture inside a frame shaped like its place on the site: drag the
// picture (or use the arrow keys) to choose what stays in view, and the
// slider to zoom. The preview beside the forms follows along.
// `frameClass` is the frame's Tailwind aspect class (src/content/frames.ts).
const props = defineProps<{ imageKey: string; frameClass: string }>()
const crop = defineModel<ImageCrop>({ required: true })
const zoomId = useId()

// Each arrow key moves the picture like a short drag that way, in percent.
const KEY_STEP = 2
const KEY_MOVES: Record<string, [number, number]> = {
  ArrowLeft: [-KEY_STEP, 0],
  ArrowRight: [KEY_STEP, 0],
  ArrowUp: [0, -KEY_STEP],
  ArrowDown: [0, KEY_STEP],
}

const frame = ref<HTMLElement | null>(null)
let lastPointer: { x: number; y: number } | null = null

const clamp = (value: number) => Math.min(100, Math.max(0, value))

// Dragging the picture right shows more of its left side, so the focus
// point moves the other way; zooming in makes each pixel of drag count less.
function moveBy(percentX: number, percentY: number) {
  const { x, y, zoom } = crop.value
  crop.value = { x: clamp(x - percentX / zoom), y: clamp(y - percentY / zoom), zoom }
}

function onPointerDown(event: PointerEvent) {
  lastPointer = { x: event.clientX, y: event.clientY }
  frame.value?.setPointerCapture?.(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (!lastPointer || !frame.value) return
  const { width, height } = frame.value.getBoundingClientRect()
  moveBy(((event.clientX - lastPointer.x) / width) * 100, ((event.clientY - lastPointer.y) / height) * 100)
  lastPointer = { x: event.clientX, y: event.clientY }
}

function onKey(event: KeyboardEvent) {
  const move = KEY_MOVES[event.key]
  if (!move) return
  event.preventDefault()
  moveBy(move[0], move[1])
}

function setZoom(event: Event) {
  crop.value = { ...crop.value, zoom: Number((event.target as HTMLInputElement).value) }
}
</script>

<template>
  <div class="space-y-2">
    <div
      ref="frame"
      role="application"
      tabindex="0"
      aria-label="Picture position: drag it, or use the arrow keys, to choose what stays in view"
      class="relative w-full max-w-xs cursor-grab touch-none overflow-hidden rounded-md border border-panel-line bg-panel-back active:cursor-grabbing"
      :class="props.frameClass"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="lastPointer = null"
      @pointercancel="lastPointer = null"
      @keydown="onKey"
    >
      <FramedImage :image-key="imageKey" :crop="crop" alt="" eager />
    </div>
    <div class="flex max-w-xs items-center gap-3">
      <label :for="zoomId" class="text-sm font-semibold">Zoom</label>
      <input :id="zoomId" type="range" min="1" max="3" step="0.05" :value="crop.zoom" class="flex-1" @input="setZoom" />
      <button type="button" class="rounded-md border border-panel-line px-3 py-1 text-sm" @click="crop = centredCrop()">
        Reset
      </button>
    </div>
  </div>
</template>
