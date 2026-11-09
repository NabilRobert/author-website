<script setup lang="ts">
import type { BlockOf } from '@shared/blocks'
import TextField from '@/editor/fields/TextField.vue'

// The contact block: its details come from the "About you" tab.
const block = defineModel<BlockOf<'contact'>>({ required: true })
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-panel-muted">Shows your contact details from the “About you” tab.</p>
    <TextField v-model="block.heading" label="Heading" hint="Optional." />
  </div>
</template>
