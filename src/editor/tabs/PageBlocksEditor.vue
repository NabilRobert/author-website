<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
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
// Any block can be minimised to its title row, to see the page's order at a glance.
const blocks = defineModel<Block[]>({ required: true })
const selection = useBlockSelection()
const root = ref<HTMLElement>()

// Minimised blocks hide their form with v-show, so a half-done crop or an
// open box style survives being minimised.
const minimisedIds = ref(new Set<string>())
const isMinimised = (blockId: string) => minimisedIds.value.has(blockId)
function toggleMinimised(blockId: string) {
  if (isMinimised(blockId)) minimisedIds.value.delete(blockId)
  else minimisedIds.value.add(blockId)
}
const minimiseAll = () => (minimisedIds.value = new Set(blocks.value.map((block) => block.id)))
const expandAll = () => (minimisedIds.value = new Set())

// A short reminder of what a minimised block says: its heading, or a quote's words.
function summaryOf(block: Block): string {
  if (block.type === 'quote') return block.quote
  return 'heading' in block ? block.heading : ''
}

function selectFromForm(blockId: string) {
  if (selection.value?.blockId !== blockId) selection.value = { blockId, source: 'form' }
}

// A block clicked in the preview: open its form if minimised, and scroll
// to it. onMounted covers the Pages tab opening because of that click
// (this list is new then).
async function scrollToPickedForm() {
  const picked = selection.value
  if (picked?.source !== 'preview') return
  if (minimisedIds.value.delete(picked.blockId)) await nextTick()
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
    <div v-if="blocks.length > 1" class="flex gap-2 text-sm">
      <button type="button" class="rounded-md border border-panel-line px-3 py-1" @click="minimiseAll">
        Minimise all
      </button>
      <button type="button" class="rounded-md border border-panel-line px-3 py-1" @click="expandAll">Expand all</button>
    </div>
    <section
      v-for="(block, index) in blocks"
      :key="block.id"
      class="rounded-md border border-panel-line bg-panel p-4 data-selected:border-action data-selected:ring-2 data-selected:ring-action"
      :aria-label="`Block ${index + 1}: ${BLOCK_NAMES[block.type]}`"
      :data-block-form="block.id"
      :data-selected="selection?.blockId === block.id || undefined"
      @focusin="selectFromForm(block.id)"
    >
      <div class="flex flex-wrap items-center justify-between gap-3" :class="{ 'mb-4': !isMinimised(block.id) }">
        <h3 class="min-w-0 text-lg font-semibold">
          <button
            type="button"
            class="flex items-center gap-2 text-left"
            :aria-expanded="!isMinimised(block.id)"
            :aria-controls="`block-form-${block.id}`"
            @click="toggleMinimised(block.id)"
          >
            <span aria-hidden="true" class="w-4 text-panel-muted">{{ isMinimised(block.id) ? '▸' : '▾' }}</span>
            <span>{{ index + 1 }}. {{ BLOCK_NAMES[block.type] }}</span>
          </button>
          <span
            v-if="isMinimised(block.id) && summaryOf(block)"
            class="block truncate pl-6 text-sm font-normal text-panel-muted"
          >
            {{ summaryOf(block) }}
          </span>
        </h3>
        <ItemControls
          :item-name="`block ${index + 1} (${BLOCK_NAMES[block.type]})`"
          :is-first="index === 0"
          :is-last="index === blocks.length - 1"
          @move="(offset) => moveItem(blocks, index, offset)"
          @remove="blocks.splice(index, 1)"
        />
      </div>
      <div v-show="!isMinimised(block.id)" :id="`block-form-${block.id}`">
        <BlockForm v-model="blocks[index]!" />
        <details class="mt-4 rounded-md border border-panel-line p-3">
          <summary class="cursor-pointer font-semibold">Box style: colour, pattern, opacity, corners</summary>
          <div class="mt-4"><BoxStyleFields v-model="blocks[index]!.style" /></div>
        </details>
      </div>
    </section>
    <AddBlockPicker v-if="blocks.length < MAX_BLOCKS_PER_PAGE" @add="addBlock" />
  </div>
</template>
