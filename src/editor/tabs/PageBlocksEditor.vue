<script setup lang="ts">
import { BLOCK_NAMES } from '@shared/blocks'
import type { BlockType } from '@shared/blocks'
import type { Page } from '@shared/schema'
import { MAX_BLOCKS_PER_PAGE } from '@shared/schema'
import { moveItem, newBlock } from '@/editor/newItems'
import BlockForm from '@/editor/block-forms/BlockForm.vue'
import BoxStyleFields from '@/editor/fields/BoxStyleFields.vue'
import ItemControls from '@/editor/fields/ItemControls.vue'
import AddBlockPicker from '@/editor/tabs/AddBlockPicker.vue'

// A page's blocks, top to bottom, each with its form and buttons to move or
// remove it, then the picker to add another.
const page = defineModel<Page>({ required: true })

function addBlock(type: BlockType) {
  page.value.blocks.push(newBlock(type))
}
</script>

<template>
  <div class="space-y-6">
    <p v-if="!page.blocks.length" class="rounded-md bg-notice p-4">
      This page is empty. Add a block below to start building it.
    </p>
    <section
      v-for="(block, index) in page.blocks"
      :key="block.id"
      class="rounded-md border border-panel-line bg-panel p-4"
      :aria-label="`Block ${index + 1}: ${BLOCK_NAMES[block.type]}`"
    >
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 class="text-lg font-semibold">{{ index + 1 }}. {{ BLOCK_NAMES[block.type] }}</h3>
        <ItemControls
          :item-name="`block ${index + 1} (${BLOCK_NAMES[block.type]})`"
          :is-first="index === 0"
          :is-last="index === page.blocks.length - 1"
          @move="(offset) => moveItem(page.blocks, index, offset)"
          @remove="page.blocks.splice(index, 1)"
        />
      </div>
      <BlockForm v-model="page.blocks[index]!" />
      <details class="mt-4 rounded-md border border-panel-line p-3">
        <summary class="cursor-pointer font-semibold">Box style: colour, pattern, opacity, corners</summary>
        <div class="mt-4"><BoxStyleFields v-model="page.blocks[index]!.style" /></div>
      </details>
    </section>
    <AddBlockPicker v-if="page.blocks.length < MAX_BLOCKS_PER_PAGE" @add="addBlock" />
  </div>
</template>
