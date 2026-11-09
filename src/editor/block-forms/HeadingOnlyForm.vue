<script setup lang="ts">
import type { BlockOf } from '@shared/blocks'
import TextField from '@/editor/fields/TextField.vue'

// For blocks whose content comes from the "About you" tab: contact details
// and the press kit.
const block = defineModel<BlockOf<'contact'> | BlockOf<'pressKit'>>({ required: true })
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-panel-muted">Shows your details from the “About you” tab and your work.</p>
    <TextField v-model="block.heading" label="Heading" hint="Optional." />
  </div>
</template>
