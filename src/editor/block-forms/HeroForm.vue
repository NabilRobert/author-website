<script setup lang="ts">
import { FRAME_CLASSES, WORK_SHAPE_CLASSES } from '@/content/frames'
import { CORNER_OPTIONS, SHAPE_OPTIONS } from '@/editor/fields/pictureOptions'
import type { BlockOf } from '@shared/blocks'
import TextField from '@/editor/fields/TextField.vue'
import ColourField from '@/editor/fields/ColourField.vue'
import ImageField from '@/editor/fields/ImageField.vue'
import ChoiceField from '@/editor/fields/ChoiceField.vue'

const block = defineModel<BlockOf<'hero'>>({ required: true })
const BANNER_SHAPES = [{ value: '' as const, label: 'Fits the words' }, ...SHAPE_OPTIONS]
</script>

<template>
  <div class="space-y-4">
    <TextField v-model="block.heading" label="Heading" />
    <TextField v-model="block.subheading" label="Line under the heading" hint="Optional." />
    <TextField v-model="block.buttonLabel" label="Button text" hint="Leave empty for no button." />
    <TextField
      v-model="block.buttonUrl"
      label="Button link"
      hint="A page on this site, like /work, or a full web address."
    />
    <ImageField
      v-model="block.imageKey"
      v-model:crop="block.imageCrop"
      :frame-class="block.bannerShape ? WORK_SHAPE_CLASSES[block.bannerShape] : FRAME_CLASSES.banner"
      label="Background picture"
      hint="Optional. It is dimmed so the words stay readable."
    />
    <div class="grid gap-4 sm:grid-cols-2">
      <ColourField v-model="block.backgroundColour" label="Banner colour" can-be-empty can-be-none />
      <ColourField v-model="block.textColour" label="Banner text colour" can-be-empty />
      <ChoiceField v-model="block.bannerShape" label="Shape of the banner" :options="BANNER_SHAPES" />
      <ChoiceField v-model="block.pictureCorners" label="Corners of the banner" :options="CORNER_OPTIONS" />
    </div>
  </div>
</template>
