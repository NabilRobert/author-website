<script setup lang="ts">
import type { BlockOf } from '@shared/blocks'
import TextField from '@/editor/fields/TextField.vue'
import CheckboxField from '@/editor/fields/CheckboxField.vue'
import ItemControls from '@/editor/fields/ItemControls.vue'
import { moveItem } from '@/editor/newItems'

const block = defineModel<BlockOf<'list'>>({ required: true })
</script>

<template>
  <div class="space-y-4">
    <TextField v-model="block.heading" label="Heading" hint="Optional." />
    <CheckboxField v-model="block.numbered" label="Number the items (1, 2, 3) instead of bullets" />
    <div v-for="(_item, index) in block.items" :key="index" class="space-y-2">
      <TextField v-model="block.items[index]!" :label="`Item ${index + 1}`" />
      <ItemControls
        :item-name="`item ${index + 1}`"
        :is-first="index === 0"
        :is-last="index === block.items.length - 1"
        @move="(offset) => moveItem(block.items, index, offset)"
        @remove="block.items.splice(index, 1)"
      />
    </div>
    <button
      type="button"
      class="rounded-md border border-action px-4 py-2 font-semibold text-action"
      @click="block.items.push('')"
    >
      + Add an item
    </button>
  </div>
</template>
