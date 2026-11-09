<script setup lang="ts">
import type { BlockOf } from '@shared/blocks'
import TextField from '@/editor/fields/TextField.vue'
import ChoiceField from '@/editor/fields/ChoiceField.vue'

const block = defineModel<BlockOf<'works'>>({ required: true })
const SHOW = [
  { value: 'all' as const, label: 'All of it, in the order of the Work tab' },
  { value: 'newest' as const, label: 'Only the newest (by date)' },
]
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-panel-muted">Shows your work from the Work tab.</p>
    <TextField v-model="block.heading" label="Heading" hint="Optional." />
    <ChoiceField v-model="block.show" label="Which works" :options="SHOW" />
  </div>
</template>
