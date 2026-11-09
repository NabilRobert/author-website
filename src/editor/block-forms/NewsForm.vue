<script setup lang="ts">
import type { BlockOf } from '@shared/blocks'
import TextField from '@/editor/fields/TextField.vue'
import NumberField from '@/editor/fields/NumberField.vue'

const block = defineModel<BlockOf<'news'>>({ required: true })
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-panel-muted">Shows the posts and events from the News tab, newest first.</p>
    <TextField v-model="block.heading" label="Heading" hint="Optional." />
    <NumberField v-model="block.limit" label="How many to show" hint="Leave empty to show them all." />
  </div>
</template>
