<script setup lang="ts">
import type { BlockOf } from '@shared/blocks'
import TextField from '@/editor/fields/TextField.vue'
import ColourField from '@/editor/fields/ColourField.vue'
import ImageField from '@/editor/fields/ImageField.vue'

const block = defineModel<BlockOf<'hero'>>({ required: true })
</script>

<template>
  <div class="space-y-4">
    <TextField v-model="block.heading" label="Heading" />
    <TextField v-model="block.subheading" label="Line under the heading" hint="Optional." />
    <TextField v-model="block.buttonLabel" label="Button text" hint="Leave empty for no button." />
    <TextField
      v-model="block.buttonUrl"
      label="Button link"
      hint="A page on this site, like /books, or a full web address."
    />
    <ImageField
      v-model="block.imageKey"
      label="Background picture"
      hint="Optional. It is dimmed so the words stay readable."
    />
    <div class="grid gap-4 sm:grid-cols-2">
      <ColourField v-model="block.backgroundColour" label="Banner colour" can-be-empty />
      <ColourField v-model="block.textColour" label="Banner text colour" can-be-empty />
    </div>
  </div>
</template>
