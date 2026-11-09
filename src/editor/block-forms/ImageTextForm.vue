<script setup lang="ts">
import type { BlockOf } from '@shared/blocks'
import TextField from '@/editor/fields/TextField.vue'
import ChoiceField from '@/editor/fields/ChoiceField.vue'
import ImageField from '@/editor/fields/ImageField.vue'

const block = defineModel<BlockOf<'imageText'>>({ required: true })
const SIDES = [
  { value: 'left' as const, label: 'Picture on the left' },
  { value: 'right' as const, label: 'Picture on the right' },
]
</script>

<template>
  <div class="space-y-4">
    <TextField v-model="block.heading" label="Heading" hint="Optional." />
    <TextField v-model="block.body" label="Text" hint="Leave a blank line to start a new paragraph." multiline />
    <ImageField v-model="block.imageKey" v-model:crop="block.imageCrop" shape="picture" label="Picture" />
    <TextField
      v-model="block.imageDescription"
      label="What the picture shows"
      hint="Read aloud to visitors who can't see it, like “Mara at her desk by the window”."
    />
    <ChoiceField v-model="block.imageSide" label="Where the picture goes" :options="SIDES" />
  </div>
</template>
