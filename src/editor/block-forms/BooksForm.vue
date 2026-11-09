<script setup lang="ts">
import type { BlockOf } from '@shared/blocks'
import TextField from '@/editor/fields/TextField.vue'
import ChoiceField from '@/editor/fields/ChoiceField.vue'

const block = defineModel<BlockOf<'books'>>({ required: true })
const SHOW = [
  { value: 'all' as const, label: 'All books, in the order of the Books tab' },
  { value: 'newest' as const, label: 'Only the newest book' },
]
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-panel-muted">Shows the books from the Books tab.</p>
    <TextField v-model="block.heading" label="Heading" hint="Optional." />
    <ChoiceField v-model="block.show" label="Which books" :options="SHOW" />
  </div>
</template>
