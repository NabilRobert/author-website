<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { BLOCK_NAMES } from '@shared/blocks'
import type { Block, BlockType } from '@shared/blocks'
import { MAX_BLOCKS_PER_PAGE } from '@shared/schema'
import { moveItem, newBlock } from '@/editor/newItems'
import BlockForm from '@/editor/block-forms/BlockForm.vue'
import BoxStyleFields from '@/editor/fields/BoxStyleFields.vue'
import ItemControls from '@/editor/fields/ItemControls.vue'
import AddBlockPicker from '@/editor/tabs/AddBlockPicker.vue'
import { useBlockSelection } from '@/editor/blockSelection'

// A page's blocks (or a work's own page's), top to bottom, each with its form and buttons to move or
// remove it, then the picker to add another. The selected block's form is
// highlighted; working in a form selects its block, so the preview outlines it.
const blocks = defineModel<Block[]>({ required: true })
const selection = useBlockSelection()
const root = ref<HTMLElement>()

function selectFromForm(blockId: string) {
  if (selection.value?.blockId !== blockId) selection.value = { blockId, source: 'form' }
}

// A block clicked in the preview: scroll to its form. onMounted covers the
// Pages tab opening because of that click (this list is new then).
function scrollToPickedForm() {
  const picked = selection.value
  if (picked?.source !== 'preview') return
  const form = root.value?.querySelector(`[data-block-form="${picked.blockId}"]`)
  form?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
watch(selection, scrollToPickedForm, { flush: 'post' })
onMounted(scrollToPickedForm)

function addBlock(type: BlockType) {
  blocks.value.push(newBlock(type))
}
</script>

<template>
  <div ref="root" class="space-y-6">
    <p v-if="!blocks.length" class="rounded-md bg-notice p-4">
      This page is empty. Add a block below to start building it.
    </p>
    <section
      v-for="(block, index) in blocks"
      :key="block.id"
      class="rounded-md border border-panel-line bg-panel p-4 data-selected:border-action data-selected:ring-2 data-selected:ring-action"
      :aria-label="`Block ${index + 1}: ${BLOCK_NAMES[block.type]}`"
      :data-block-form="block.id"
      :data-selected="selection?.blockId === block.id || undefined"
      @focusin="selectFromForm(block.id)"
    >
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 class="text-lg font-semibold">{{ index + 1 }}. {{ BLOCK_NAMES[block.type] }}</h3>
        <ItemControls
          :item-name="`block ${index + 1} (${BLOCK_NAMES[block.type]})`"
          :is-first="index === 0"
          :is-last="index === blocks.length - 1"
          @move="(offset) => moveItem(blocks, index, offset)"
          @remove="blocks.splice(index, 1)"
        />
      </div>
      <BlockForm v-model="blocks[index]!" />
      <details class="mt-4 rounded-md border border-panel-line p-3">
        <summary class="cursor-pointer font-semibold">Box style: colour, pattern, opacity, corners</summary>
        <div class="mt-4"><BoxStyleFields v-model="blocks[index]!.style" /></div>
      </details>
    </section>
    <AddBlockPicker v-if="blocks.length < MAX_BLOCKS_PER_PAGE" @add="addBlock" />
  </div>
</template>
