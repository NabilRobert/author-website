<script setup lang="ts">
import type { BlockOf } from '@shared/blocks'
import TextField from '@/editor/fields/TextField.vue'

const block = defineModel<BlockOf<'text'>>({ required: true })
</script>

<template>
  <div class="space-y-4">
    <TextField v-model="block.heading" label="Heading" hint="Optional." />
    <TextField v-model="block.body" label="Text" hint="Leave a blank line to start a new paragraph." multiline />
  </div>
</template>
