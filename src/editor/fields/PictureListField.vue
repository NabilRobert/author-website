<script setup lang="ts">
import type { GalleryPicture } from '@shared/blocks'
import { MAX_GALLERY_PICTURES } from '@shared/blocks'
import { centredCrop } from '@shared/fields'
import { moveItem } from '@/editor/newItems'
import ImageField from '@/editor/fields/ImageField.vue'
import TextField from '@/editor/fields/TextField.vue'
import ItemControls from '@/editor/fields/ItemControls.vue'

// A list of pictures to upload, crop, caption and put in order: a gallery
// block's, or a work's more pictures. `frameClass` is the shape they are
// cropped to (src/content/frames.ts).
defineProps<{ frameClass: string; emptyHint: string }>()
const pictures = defineModel<GalleryPicture[]>({ required: true })

function addPicture() {
  pictures.value.push({ imageKey: null, imageCrop: centredCrop(), description: '' })
}
</script>

<template>
  <div class="space-y-4">
    <p v-if="!pictures.length" class="rounded-md bg-notice p-3 text-sm">{{ emptyHint }}</p>
    <fieldset
      v-for="(picture, index) in pictures"
      :key="index"
      class="space-y-3 rounded-md border border-panel-line p-3"
    >
      <legend class="px-1 font-semibold">Picture {{ index + 1 }}</legend>
      <ImageField
        v-model="picture.imageKey"
        v-model:crop="picture.imageCrop"
        :frame-class="frameClass"
        label="Picture"
      />
      <TextField
        v-model="picture.description"
        label="Caption"
        hint="Shown under the picture and read aloud to visitors who can't see it."
      />
      <ItemControls
        :item-name="`picture ${index + 1}`"
        :is-first="index === 0"
        :is-last="index === pictures.length - 1"
        @move="(offset) => moveItem(pictures, index, offset)"
        @remove="pictures.splice(index, 1)"
      />
    </fieldset>
    <button
      v-if="pictures.length < MAX_GALLERY_PICTURES"
      type="button"
      class="rounded-md border border-action px-4 py-2 font-semibold text-action"
      @click="addPicture"
    >
      + Add a picture
    </button>
  </div>
</template>
