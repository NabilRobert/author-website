<script setup lang="ts">
import { GALLERY_COLUMNS, MAX_GALLERY_PICTURES } from '@shared/blocks'
import type { BlockOf } from '@shared/blocks'
import { centredCrop } from '@shared/fields'
import { WORK_SHAPE_CLASSES } from '@/content/frames'
import { moveItem } from '@/editor/newItems'
import TextField from '@/editor/fields/TextField.vue'
import ChoiceField from '@/editor/fields/ChoiceField.vue'
import ImageField from '@/editor/fields/ImageField.vue'
import ItemControls from '@/editor/fields/ItemControls.vue'
import { CORNER_OPTIONS, SHAPE_OPTIONS } from '@/editor/fields/pictureOptions'

// A gallery's pictures (upload, crop, caption, order) and how they are laid out.
const block = defineModel<BlockOf<'gallery'>>({ required: true })
const COLUMN_OPTIONS = GALLERY_COLUMNS.map((count) => ({ value: count, label: `${count} side by side` }))

function addPicture() {
  block.value.pictures.push({ imageKey: null, imageCrop: centredCrop(), description: '' })
}
</script>

<template>
  <div class="space-y-4">
    <TextField v-model="block.heading" label="Heading" hint="Optional." />
    <div class="grid gap-4 sm:grid-cols-3">
      <ChoiceField v-model="block.columns" label="Pictures in a row" :options="COLUMN_OPTIONS" />
      <ChoiceField v-model="block.imageShape" label="Shape" :options="SHAPE_OPTIONS" />
      <ChoiceField v-model="block.pictureCorners" label="Corners" :options="CORNER_OPTIONS" />
    </div>
    <p v-if="!block.pictures.length" class="rounded-md bg-notice p-3 text-sm">
      No pictures yet. Add some below; until then visitors see only the heading.
    </p>
    <fieldset
      v-for="(picture, index) in block.pictures"
      :key="index"
      class="space-y-3 rounded-md border border-panel-line p-3"
    >
      <legend class="px-1 font-semibold">Picture {{ index + 1 }}</legend>
      <ImageField
        v-model="picture.imageKey"
        v-model:crop="picture.imageCrop"
        :frame-class="WORK_SHAPE_CLASSES[block.imageShape]"
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
        :is-last="index === block.pictures.length - 1"
        @move="(offset) => moveItem(block.pictures, index, offset)"
        @remove="block.pictures.splice(index, 1)"
      />
    </fieldset>
    <button
      v-if="block.pictures.length < MAX_GALLERY_PICTURES"
      type="button"
      class="rounded-md border border-action px-4 py-2 font-semibold text-action"
      @click="addPicture"
    >
      + Add a picture
    </button>
  </div>
</template>
