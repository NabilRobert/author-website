<script setup lang="ts">
import type { BlockOf } from '@shared/blocks'
import TextField from '@/editor/fields/TextField.vue'

const block = defineModel<BlockOf<'quote'>>({ required: true })
</script>

<template>
  <div class="space-y-4">
    <TextField v-model="block.quote" label="Quote" multiline />
    <TextField v-model="block.source" label="Who said it" hint="Optional." />
  </div>
</template>
