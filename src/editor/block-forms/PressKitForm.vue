<script setup lang="ts">
import type { BlockOf } from '@shared/blocks'
import TextField from '@/editor/fields/TextField.vue'
import ChoiceField from '@/editor/fields/ChoiceField.vue'
import { CORNER_OPTIONS, SHAPE_OPTIONS, WORK_SHAPE_OPTIONS } from '@/editor/fields/pictureOptions'

// The press kit's content comes from the "About you" and Work tabs; here
// are its heading and how its pictures are framed.
const block = defineModel<BlockOf<'pressKit'>>({ required: true })
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-panel-muted">Shows your details from the “About you” tab and your work.</p>
    <TextField v-model="block.heading" label="Heading" hint="Optional." />
    <ChoiceField v-model="block.photoShape" label="Shape of your photo" :options="SHAPE_OPTIONS" />
    <ChoiceField v-model="block.pictureShape" label="Shape of the pictures of work" :options="WORK_SHAPE_OPTIONS" />
    <ChoiceField v-model="block.pictureCorners" label="Corners of the pictures" :options="CORNER_OPTIONS" />
  </div>
</template>
