<script setup lang="ts">
import { GALLERY_COLUMNS } from '@shared/blocks'
import type { BlockOf } from '@shared/blocks'
import { WORK_SHAPE_CLASSES } from '@/content/frames'
import TextField from '@/editor/fields/TextField.vue'
import ChoiceField from '@/editor/fields/ChoiceField.vue'
import PictureListField from '@/editor/fields/PictureListField.vue'
import { CORNER_OPTIONS, SHAPE_OPTIONS } from '@/editor/fields/pictureOptions'

// A gallery's pictures (PictureListField) and how they are laid out.
const block = defineModel<BlockOf<'gallery'>>({ required: true })
const COLUMN_OPTIONS = GALLERY_COLUMNS.map((count) => ({ value: count, label: `${count} side by side` }))
</script>

<template>
  <div class="space-y-4">
    <TextField v-model="block.heading" label="Heading" hint="Optional." />
    <div class="grid gap-4 sm:grid-cols-3">
      <ChoiceField v-model="block.columns" label="Pictures in a row" :options="COLUMN_OPTIONS" />
      <ChoiceField v-model="block.imageShape" label="Shape" :options="SHAPE_OPTIONS" />
      <ChoiceField v-model="block.pictureCorners" label="Corners" :options="CORNER_OPTIONS" />
    </div>
    <PictureListField
      v-model="block.pictures"
      :frame-class="WORK_SHAPE_CLASSES[block.imageShape]"
      empty-hint="No pictures yet. Add some below; until then visitors see only the heading."
    />
  </div>
</template>
