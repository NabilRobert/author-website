<script setup lang="ts">
import type { BlockOf } from '@shared/blocks'
import TextField from '@/editor/fields/TextField.vue'
import LinkListField from '@/editor/fields/LinkListField.vue'

const block = defineModel<BlockOf<'buttons'>>({ required: true })
</script>

<template>
  <div class="space-y-4">
    <TextField v-model="block.heading" label="Heading" hint="Optional." />
    <LinkListField
      v-model="block.links"
      label="Buttons"
      add-label="Add a button"
      url-hint="A page on this site, like /books, or a full web address."
    />
  </div>
</template>
