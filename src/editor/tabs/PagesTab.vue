<script setup lang="ts">
import { computed, ref } from 'vue'
import { MAX_PAGES } from '@shared/schema'
import { useDraft } from '@/editor/useEditor'
import { moveItem, newPage } from '@/editor/newItems'
import ItemControls from '@/editor/fields/ItemControls.vue'
import PageSettings from '@/editor/tabs/PageSettings.vue'
import PageBlocksEditor from '@/editor/tabs/PageBlocksEditor.vue'
import TemplatePicker from '@/editor/tabs/TemplatePicker.vue'
import { PAGE_TEMPLATES } from '@/editor/pageTemplates'
import type { PageTemplate } from '@/editor/pageTemplates'

// Pages: pick a page, change its settings and blocks, add, reorder or
// remove pages. A new page starts from a layout (src/editor/pageTemplates.ts).
// The page picked here is the one the preview shows.
const draft = useDraft()
const selectedPageId = defineModel<string>('pageId', { required: true })

const selectedIndex = computed(() => draft.value.pages.findIndex((page) => page.id === selectedPageId.value))

const isChoosingLayout = ref(false)

function addPage(template: PageTemplate) {
  const takenSlugs = draft.value.pages.map((existing) => existing.slug)
  const page = { ...newPage(template.title, takenSlugs), blocks: template.blocks() }
  draft.value.pages.push(page)
  selectedPageId.value = page.id
  isChoosingLayout.value = false
}

function removeSelectedPage() {
  draft.value.pages.splice(selectedIndex.value, 1)
  selectedPageId.value = draft.value.pages[0]?.id ?? ''
}
</script>

<template>
  <div class="space-y-8">
    <nav aria-label="Your pages">
      <h2 class="mb-3 text-xl font-semibold">Your pages</h2>
      <ul class="flex flex-wrap gap-2">
        <li v-for="page in draft.pages" :key="page.id">
          <button
            type="button"
            :aria-pressed="page.id === selectedPageId"
            class="rounded-md border-2 px-4 py-2 font-semibold aria-pressed:border-action aria-pressed:bg-action aria-pressed:text-panel"
            :class="page.id === selectedPageId ? '' : 'border-panel-line bg-panel'"
            @click="selectedPageId = page.id"
          >
            {{ page.title || 'Untitled' }} <span class="font-normal opacity-80">/{{ page.slug }}</span>
          </button>
        </li>
        <li v-if="draft.pages.length < MAX_PAGES">
          <button
            type="button"
            class="rounded-md border-2 border-action px-4 py-2 font-semibold text-action"
            :aria-expanded="isChoosingLayout"
            @click="isChoosingLayout = !isChoosingLayout"
          >
            + Add a page
          </button>
        </li>
      </ul>
    </nav>
    <TemplatePicker
      v-if="isChoosingLayout"
      title="Choose a layout for the new page"
      :templates="PAGE_TEMPLATES"
      @pick="addPage"
      @cancel="isChoosingLayout = false"
    />

    <template v-if="selectedIndex >= 0">
      <section class="space-y-4 rounded-md border border-panel-line bg-panel p-4">
        <h2 class="text-xl font-semibold">Page settings</h2>
        <PageSettings v-model="draft.pages[selectedIndex]!" />
        <ItemControls
          v-if="draft.pages[selectedIndex]!.slug !== ''"
          :item-name="`the page “${draft.pages[selectedIndex]!.title}”`"
          :is-first="selectedIndex === 0"
          :is-last="selectedIndex === draft.pages.length - 1"
          @move="(offset) => moveItem(draft.pages, selectedIndex, offset)"
          @remove="removeSelectedPage"
        />
      </section>
      <section>
        <h2 class="mb-4 text-xl font-semibold">Blocks on this page</h2>
        <PageBlocksEditor v-model="draft.pages[selectedIndex]!" />
      </section>
    </template>
  </div>
</template>
