<script setup lang="ts">
import type { SiteContent } from '@shared/schema'
import SitePreview from '@/editor/SitePreview.vue'
import { useBlockSelection } from '@/editor/blockSelection'

// The preview side: which page to show, and the page itself. Its layout
// follows the panel's width, like a phone, tablet or computer screen.
defineProps<{ content: SiteContent }>()
const pageId = defineModel<string>('pageId', { required: true })
const selection = useBlockSelection()

function selectFromPreview(blockId: string) {
  selection.value = { blockId, source: 'preview' }
}
</script>

<template>
  <section aria-label="Preview" class="p-4">
    <h2 class="mb-2 font-semibold">Preview: what visitors will see after you save</h2>
    <p class="mb-2 text-sm text-panel-muted">Click a block to edit it.</p>
    <label class="mb-3 flex items-center gap-2 text-sm">
      Page:
      <select v-model="pageId" class="rounded-md border border-panel-line bg-panel p-2">
        <option v-for="page in content.pages" :key="page.id" :value="page.id">{{ page.title }}</option>
        <optgroup v-if="content.works.length" label="Pages of your work">
          <option v-for="work in content.works" :key="work.id" :value="work.id">{{ work.title }}</option>
        </optgroup>
      </select>
    </label>
    <SitePreview
      :content="content"
      :page-id="pageId"
      :selected-block-id="selection?.blockId"
      @select-block="selectFromPreview"
    />
  </section>
</template>
