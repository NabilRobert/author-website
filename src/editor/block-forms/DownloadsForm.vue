<script setup lang="ts">
import { MAX_DOWNLOADS } from '@shared/blocks'
import type { BlockOf } from '@shared/blocks'
import { moveItem } from '@/editor/newItems'
import TextField from '@/editor/fields/TextField.vue'
import FileField from '@/editor/fields/FileField.vue'
import ItemControls from '@/editor/fields/ItemControls.vue'

// The PDFs a downloads block offers: each one's file and the words on its link.
const block = defineModel<BlockOf<'downloads'>>({ required: true })

function addFile() {
  block.value.files.push({ fileKey: null, label: '' })
}
</script>

<template>
  <div class="space-y-4">
    <TextField v-model="block.heading" label="Heading" hint="Optional." />
    <p v-if="!block.files.length" class="rounded-md bg-notice p-3 text-sm">
      No files yet. Add one below; until then visitors see only the heading.
    </p>
    <fieldset
      v-for="(file, index) in block.files"
      :key="index"
      class="space-y-3 rounded-md border border-panel-line p-3"
    >
      <legend class="px-1 font-semibold">File {{ index + 1 }}</legend>
      <FileField v-model="file.fileKey" />
      <TextField v-model="file.label" label="Link text" hint='What visitors click, like "My CV" or "Portfolio 2026".' />
      <ItemControls
        :item-name="`file ${index + 1}`"
        :is-first="index === 0"
        :is-last="index === block.files.length - 1"
        @move="(offset) => moveItem(block.files, index, offset)"
        @remove="block.files.splice(index, 1)"
      />
    </fieldset>
    <button
      v-if="block.files.length < MAX_DOWNLOADS"
      type="button"
      class="rounded-md border border-action px-4 py-2 font-semibold text-action"
      @click="addFile"
    >
      + Add a file
    </button>
  </div>
</template>
