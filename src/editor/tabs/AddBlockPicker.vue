<script setup lang="ts">
import { BLOCK_NAMES } from '@shared/blocks'
import type { BlockType } from '@shared/blocks'
import BlockThumbnail from '@/editor/tabs/BlockThumbnail.vue'

// Big buttons, one per block type with a small sketch of it, to add a block
// at the end of the page.
const emit = defineEmits<{ add: [type: BlockType] }>()

const DESCRIPTIONS: Record<BlockType, string> = {
  hero: 'A large heading with an optional button and colours',
  text: 'A heading and paragraphs',
  imageText: 'A picture beside some text',
  gallery: 'A grid of pictures, each with a caption',
  list: 'Bullet points or a numbered list',
  quote: 'A large quotation',
  buttons: 'A row of buttons linking anywhere',
  works: 'Your work, in the order of the Work tab',
  news: 'Your news and events, from the News tab',
  contact: 'Your email, social links and newsletter',
  pressKit: 'Short bio, photo and pictures of your work for the press',
}
const TYPES = Object.keys(BLOCK_NAMES) as BlockType[]
</script>

<template>
  <fieldset>
    <legend class="mb-3 text-lg font-semibold">Add a block to this page</legend>
    <div class="grid gap-3 sm:grid-cols-2">
      <button
        v-for="type in TYPES"
        :key="type"
        type="button"
        class="flex items-center gap-3 rounded-md border-2 border-panel-line bg-panel p-3 text-left hover:border-action"
        @click="emit('add', type)"
      >
        <BlockThumbnail :type="type" />
        <span>
          <span class="block font-semibold">+ {{ BLOCK_NAMES[type] }}</span>
          <span class="block text-sm text-panel-muted">{{ DESCRIPTIONS[type] }}</span>
        </span>
      </button>
    </div>
  </fieldset>
</template>
